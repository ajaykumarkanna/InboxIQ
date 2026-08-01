import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';
import initSqlJs, { Database } from 'sql.js';

const app = express();
const PORT = 3000;

app.set('trust proxy', 1);

const sessionsMap = new Map<string, { tokens?: any; user?: any; isDemo?: boolean }>();

app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'inboxiq_secret_session_key_2026',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Session Token Middleware for cross-origin / iframe fallback
app.use((req, res, next) => {
  let token = (req.headers['x-session-token'] as string) || (req.query.auth_token as string);
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token && sessionsMap.has(token)) {
    const sessionData = sessionsMap.get(token)!;
    req.session.tokens = sessionData.tokens;
    req.session.user = sessionData.user;
    req.session.isDemo = sessionData.isDemo;
    (req as any).sessionToken = token;
  }
  next();
});

// Declare session types
declare module 'express-session' {
  interface SessionData {
    tokens?: any;
    user?: {
      id: string;
      name: string;
      email: string;
      picture?: string;
    };
    isDemo?: boolean;
  }
}

// In-memory or SQL.js DB for email metadata storage
let db: Database | null = null;

async function initDB() {
  try {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS email_metadata (
        id TEXT PRIMARY KEY,
        threadId TEXT,
        sender TEXT,
        senderEmail TEXT,
        subject TEXT,
        snippet TEXT,
        date TEXT,
        timestamp INTEGER,
        size INTEGER,
        labelIds TEXT,
        category TEXT,
        hasAttachment INTEGER,
        isUnread INTEGER,
        isImportant INTEGER,
        isStarred INTEGER,
        unsubscribeUrl TEXT
      );
    `);
    console.log('SQL.js database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize SQL.js database:', err);
  }
}

initDB();

// Google OAuth Client helper
function getOAuth2Client(req?: express.Request) {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

  let appUrl = process.env.APP_URL;
  if (!appUrl && req) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
    if (host) {
      appUrl = `${proto}://${host}`;
    }
  }
  if (!appUrl) {
    appUrl = `http://localhost:${PORT}`;
  }

  const redirectUri = `${appUrl.replace(/\/$/, '')}/auth/callback`;

  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return { client, redirectUri };
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Google OAuth Initiate
app.get('/api/auth/google', (req, res) => {
  const { client: oauth2Client, redirectUri } = getOAuth2Client(req);
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    redirect_uri: redirectUri,
  });

  res.redirect(authUrl);
});

// 2. OAuth Callback
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('No authorization code received.');
  }

  try {
    const { client: oauth2Client } = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user profile info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const sessionToken = 'token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const userObj = {
      id: userInfo.data.id || 'user_1',
      name: userInfo.data.name || 'Gmail User',
      email: userInfo.data.email || 'user@gmail.com',
      picture: userInfo.data.picture || undefined,
    };

    req.session.tokens = tokens;
    req.session.isDemo = false;
    req.session.user = userObj;

    sessionsMap.set(sessionToken, { tokens, user: userObj, isDemo: false });

    // Return HTML page that communicates with parent window (if in popup) and closes itself
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: system-ui, sans-serif; display: grid; place-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
            .card { text-align: center; padding: 2rem; background: #1e293b; border-radius: 12px; border: 1px solid #334155; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Connected to Gmail!</h2>
            <p>Redirecting back to InboxIQ...</p>
          </div>
          <script>
            const token = "${sessionToken}";
            const user = ${JSON.stringify(userObj)};
            if (window.opener) {
              try {
                window.opener.postMessage({ type: 'OAUTH_SUCCESS', token, user }, '*');
              } catch(e) {}
              setTimeout(() => {
                window.close();
              }, 300);
            } else {
              window.location.href = '/?auth_token=' + token;
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error handling OAuth callback:', err);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// 3. Auth Status
app.get('/api/auth/status', (req, res) => {
  if (req.session.isDemo) {
    return res.json({
      authenticated: true,
      isDemo: true,
      user: req.session.user || {
        id: 'demo_user',
        name: 'Demo Workspace User',
        email: 'user.demo@gmail.com',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      },
      token: (req as any).sessionToken || null,
    });
  }

  if (req.session.tokens && req.session.user) {
    return res.json({
      authenticated: true,
      isDemo: false,
      user: req.session.user,
      token: (req as any).sessionToken || null,
    });
  }

  res.json({
    authenticated: false,
    isDemo: false,
    user: null,
  });
});

// 4. Enable Demo Mode
app.post('/api/auth/demo', (req, res) => {
  const token = 'demo_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  const userObj = {
    id: 'demo_user',
    name: 'Demo Workspace User',
    email: 'user.demo@gmail.com',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  };
  req.session.isDemo = true;
  req.session.user = userObj;
  sessionsMap.set(token, { user: userObj, isDemo: true });
  res.json({ success: true, token, user: userObj });
});

// 5. Logout / Disconnect
app.post('/api/auth/logout', (req, res) => {
  const token = (req as any).sessionToken || (req.headers['x-session-token'] as string);
  if (token) {
    sessionsMap.delete(token);
  }
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// GET /api/emails - Fetch scanned email metadata from SQL.js
app.get('/api/emails', (req, res) => {
  if (req.session.isDemo) {
    return res.json([]);
  }

  if (!db) {
    return res.json([]);
  }

  try {
    const resSql = db.exec(`SELECT * FROM email_metadata ORDER BY timestamp DESC`);
    if (!resSql || resSql.length === 0) {
      return res.json([]);
    }

    const columns = resSql[0].columns;
    const values = resSql[0].values;

    const emails = values.map((row) => {
      const item: any = {};
      columns.forEach((col, idx) => {
        item[col] = row[idx];
      });

      return {
        id: item.id,
        threadId: item.threadId,
        sender: item.sender,
        senderEmail: item.senderEmail,
        subject: item.subject,
        snippet: item.snippet,
        date: item.date,
        timestamp: item.timestamp,
        size: item.size,
        labelIds: JSON.parse(item.labelIds || '[]'),
        category: item.category,
        hasAttachment: Boolean(item.hasAttachment),
        isUnread: Boolean(item.isUnread),
        isImportant: Boolean(item.isImportant),
        isStarred: Boolean(item.isStarred),
        unsubscribeUrl: item.unsubscribeUrl || undefined,
      };
    });

    res.json(emails);
  } catch (err: any) {
    console.error('Failed to query email metadata:', err);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Scan Progress state
let scanState = {
  status: 'idle' as 'idle' | 'scanning' | 'analyzing' | 'completed' | 'error',
  scannedCount: 0,
  totalFound: 0,
  currentStep: 'Ready to scan',
  progressPercent: 0,
  errorMessage: '',
};

// Helper for email classification logic
function classifyEmail(headers: Record<string, string>, labelIds: string[], subject: string, snippet: string, size: number, dateStr: string): string {
  const subLower = subject.toLowerCase();
  const snipLower = snippet.toLowerCase();
  const fromLower = (headers['from'] || '').toLowerCase();
  const isUnread = labelIds.includes('UNREAD');
  const msgDate = new Date(dateStr).getTime();
  const ageInDays = (Date.now() - msgDate) / (1000 * 60 * 60 * 24);

  // Large attachments (> 5MB)
  if (size > 5 * 1024 * 1024) return 'large_attachments';

  // OTP / Verification
  if (
    subLower.includes('otp') ||
    subLower.includes('verification code') ||
    subLower.includes('one time password') ||
    subLower.includes('security code') ||
    subLower.includes('2fa')
  ) {
    return 'otp';
  }

  // Finance & Banking
  if (
    fromLower.includes('bank') ||
    fromLower.includes('chase') ||
    fromLower.includes('hdfc') ||
    fromLower.includes('paypal') ||
    fromLower.includes('stripe') ||
    subLower.includes('statement') ||
    subLower.includes('invoice') ||
    subLower.includes('transaction alert')
  ) {
    return 'finance';
  }

  // Travel
  if (
    fromLower.includes('uber') ||
    fromLower.includes('air') ||
    fromLower.includes('hotel') ||
    fromLower.includes('booking') ||
    fromLower.includes('irctc') ||
    subLower.includes('e-ticket') ||
    subLower.includes('boarding pass')
  ) {
    return 'travel';
  }

  // Dev Notifications
  if (
    fromLower.includes('github') ||
    fromLower.includes('jira') ||
    fromLower.includes('atlassian') ||
    fromLower.includes('confluence') ||
    fromLower.includes('notion') ||
    fromLower.includes('google drive')
  ) {
    return 'dev_notifications';
  }

  // Social
  if (
    labelIds.includes('CATEGORY_SOCIAL') ||
    fromLower.includes('facebook') ||
    fromLower.includes('linkedin') ||
    fromLower.includes('twitter') ||
    fromLower.includes('instagram') ||
    fromLower.includes('discord') ||
    fromLower.includes('slack')
  ) {
    return 'social';
  }

  // Shopping & Delivery
  if (
    fromLower.includes('amazon') ||
    fromLower.includes('swiggy') ||
    fromLower.includes('myntra') ||
    fromLower.includes('flipkart') ||
    fromLower.includes('zomato') ||
    subLower.includes('order shipped') ||
    subLower.includes('delivery update')
  ) {
    return 'shopping';
  }

  // Unread Newsletters
  if (isUnread && (headers['list-unsubscribe'] || fromLower.includes('digest') || subLower.includes('newsletter'))) {
    return 'unread_newsletters';
  }

  // Promotions
  if (labelIds.includes('CATEGORY_PROMOTIONS') || fromLower.includes('sale') || subLower.includes('off') || subLower.includes('discount')) {
    return 'promotions';
  }

  // Old Unread (> 1 year)
  if (isUnread && ageInDays > 365) {
    return 'old_unread';
  }

  return 'promotions';
}

// 6. Trigger Scan Endpoint
app.post('/api/scan', async (req, res) => {
  if (req.session.isDemo) {
    scanState = {
      status: 'scanning',
      scannedCount: 0,
      totalFound: 3820,
      currentStep: 'Scanning inbox metadata...',
      progressPercent: 10,
      errorMessage: '',
    };
    return res.json({ success: true, message: 'Demo scan initiated' });
  }

  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const { client: oauth2Client } = getOAuth2Client(req);
    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    scanState = {
      status: 'scanning',
      scannedCount: 0,
      totalFound: 0,
      currentStep: 'Connecting to Gmail API...',
      progressPercent: 5,
      errorMessage: '',
    };

    // Respond immediately to trigger non-blocking scan
    res.json({ success: true, message: 'Scan started' });

    // Background scan pipeline
    (async () => {
      try {
        // Step 1: List messages
        scanState.currentStep = 'Fetching message listing...';
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 500, // Fetch top 500 for fast scanning
          q: 'in:inbox',
        });

        const messages = listRes.data.messages || [];
        scanState.totalFound = messages.length;
        scanState.progressPercent = 25;

        // Clear existing DB table for fresh scan
        if (db) {
          db.run(`DELETE FROM email_metadata`);
        }

        // Step 2: Fetch metadata in parallel batches
        const BATCH_SIZE = 25;
        for (let i = 0; i < messages.length; i += BATCH_SIZE) {
          const batch = messages.slice(i, i + BATCH_SIZE);
          scanState.currentStep = `Analyzing email metadata (${i + batch.length}/${messages.length})...`;

          await Promise.all(
            batch.map(async (msg) => {
              try {
                const getRes = await gmail.users.messages.get({
                  userId: 'me',
                  id: msg.id!,
                  format: 'metadata',
                  metadataHeaders: ['From', 'Subject', 'Date', 'List-Unsubscribe'],
                });

                const msgData = getRes.data;
                const headersObj: Record<string, string> = {};
                (msgData.payload?.headers || []).forEach((h) => {
                  if (h.name && h.value) {
                    headersObj[h.name.toLowerCase()] = h.value;
                  }
                });

                const fromHeader = headersObj['from'] || 'Unknown Sender';
                const subjectHeader = headersObj['subject'] || '(No Subject)';
                const dateHeader = headersObj['date'] || new Date().toISOString();
                const size = msgData.sizeEstimate || 15000;
                const labelIds = msgData.labelIds || [];
                const snippet = msgData.snippet || '';

                // Extract sender email
                let senderName = fromHeader;
                let senderEmail = fromHeader;
                const match = fromHeader.match(/(.*)<(.*)>/);
                if (match) {
                  senderName = match[1].replace(/"/g, '').trim() || match[2];
                  senderEmail = match[2].trim();
                }

                const category = classifyEmail(headersObj, labelIds, subjectHeader, snippet, size, dateHeader);

                if (db) {
                  db.run(
                    `INSERT OR REPLACE INTO email_metadata VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      msgData.id,
                      msgData.threadId,
                      senderName,
                      senderEmail,
                      subjectHeader,
                      snippet,
                      dateHeader,
                      new Date(dateHeader).getTime(),
                      size,
                      JSON.stringify(labelIds),
                      category,
                      size > 5 * 1024 * 1024 ? 1 : 0,
                      labelIds.includes('UNREAD') ? 1 : 0,
                      labelIds.includes('IMPORTANT') ? 1 : 0,
                      labelIds.includes('STARRED') ? 1 : 0,
                      headersObj['list-unsubscribe'] || '',
                    ]
                  );
                }
              } catch (e) {
                console.warn(`Failed to fetch metadata for ${msg.id}:`, e);
              }
            })
          );

          scanState.scannedCount = i + batch.length;
          scanState.progressPercent = Math.min(95, Math.round(25 + ((i + batch.length) / messages.length) * 70));
        }

        scanState.status = 'completed';
        scanState.progressPercent = 100;
        scanState.currentStep = 'Mailbox analysis complete!';
      } catch (err: any) {
        console.error('Scan background error:', err);
        scanState.status = 'error';
        scanState.errorMessage = err.message || 'Scan failed';
      }
    })();
  } catch (err: any) {
    console.error('Scan init error:', err);
    res.status(500).json({ error: err.message || 'Failed to start scan' });
  }
});

// 7. Get Progress
app.get('/api/scan/progress', (req, res) => {
  res.json(scanState);
});

// 8. Execute Batch Actions (Trash / Archive)
app.post('/api/batch-action', async (req, res) => {
  const { action, messageIds } = req.body as { action: 'delete' | 'archive' | 'keep'; messageIds: string[] };

  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ error: 'Invalid message IDs' });
  }

  // Demo mode handler
  if (req.session.isDemo) {
    return res.json({ success: true, affectedCount: messageIds.length });
  }

  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const { client: oauth2Client } = getOAuth2Client(req);
    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    if (action === 'delete') {
      // Batch modify to move to TRASH
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          addLabelIds: ['TRASH'],
          removeLabelIds: ['INBOX'],
        },
      });
    } else if (action === 'archive') {
      // Remove INBOX label
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          removeLabelIds: ['INBOX'],
        },
      });
    }

    res.json({ success: true, affectedCount: messageIds.length });
  } catch (err: any) {
    console.error('Batch action error:', err);
    res.status(500).json({ error: err.message || 'Failed to execute batch action' });
  }
});

async function startServer() {
  // Serve Vite dev server in development or built static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InboxIQ server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
