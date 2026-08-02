import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';
import initSqlJs, { Database } from 'sql.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.set('trust proxy', 1);

// Enable CORS for cross-origin frontend requests (e.g., from GitHub Pages)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-session-token');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// SQL.js DB for email metadata storage with disk persistence
let db: Database | null = null;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'inboxiq.sqlite');

function saveDBToDisk() {
  if (!db) return;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite DB to disk:', err);
  }
}

async function initDB() {
  try {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      const filebuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(filebuffer);
      console.log('Loaded existing SQLite DB from disk:', DB_PATH);
    } else {
      db = new SQL.Database();
      console.log('Created fresh SQLite DB');
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS email_metadata (
        id TEXT PRIMARY KEY,
        userEmail TEXT,
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

    try {
      db.run(`ALTER TABLE email_metadata ADD COLUMN userEmail TEXT;`);
    } catch (e) {
      // Column exists
    }

    saveDBToDisk();
    console.log('SQL.js database initialized successfully with persistent disk storage');
  } catch (err) {
    console.error('Failed to initialize SQL.js database:', err);
  }
}

initDB();

// Google OAuth Client helper
function getOAuth2Client(req?: express.Request) {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

  let redirectUri = process.env.REDIRECT_URI;
  if (!redirectUri) {
    let appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.BASE_URL;
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
    redirectUri = `${appUrl.replace(/\/$/, '')}/auth/callback`;
  }

  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return { client, redirectUri };
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Google OAuth Initiate
app.get('/api/auth/google', (req, res) => {
  const { client: oauth2Client, redirectUri } = getOAuth2Client(req);
  const reqOrigin = (req.query.origin as string) || (req.headers.referer ? new URL(req.headers.referer).origin : '');
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
    state: reqOrigin ? Buffer.from(JSON.stringify({ origin: reqOrigin })).toString('base64') : undefined,
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

    let targetOrigin = '';
    if (req.query.state) {
      try {
        const stateObj = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString('utf8'));
        if (stateObj.origin) {
          targetOrigin = stateObj.origin;
        }
      } catch (e) {}
    }

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
            const origin = "${targetOrigin}";
            if (window.opener) {
              try {
                window.opener.postMessage({ type: 'OAUTH_SUCCESS', token, user }, '*');
              } catch(e) {}
              setTimeout(() => {
                window.close();
              }, 300);
            } else if (origin) {
              window.location.href = origin + '/?auth_token=' + token;
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

  const currentUserEmail = req.session.user?.email;

  try {
    let resSql: any[] = [];
    if (currentUserEmail) {
      const sanitizedEmail = currentUserEmail.replace(/'/g, "''");
      resSql = db.exec(`SELECT * FROM email_metadata WHERE userEmail = '${sanitizedEmail}' OR userEmail IS NULL OR userEmail = '' ORDER BY timestamp DESC`);
    } else {
      resSql = db.exec(`SELECT * FROM email_metadata ORDER BY timestamp DESC`);
    }

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
  const scanLimit = typeof req.body?.limit === 'number' ? req.body.limit : 100000;
  const sendEmailReport = req.body?.sendEmailReport !== false; // Default true
  const userEmail = req.session.user?.email || '';

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
      currentStep: 'Connecting to Gmail API & listing inbox messages...',
      progressPercent: 5,
      errorMessage: '',
    };

    // Respond immediately to trigger non-blocking scan
    res.json({ success: true, message: 'Scan started' });

    // Background scan pipeline
    (async () => {
      try {
        // Step 1: Page through all messages in inbox up to scanLimit (default 100,000 / 1L)
        scanState.currentStep = 'Gathering full inbox listing from Gmail...';
        const messages: { id: string; threadId: string }[] = [];
        let nextPageToken: string | undefined = undefined;

        do {
          const listRes: any = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 500,
            pageToken: nextPageToken,
            q: 'in:inbox',
          });

          if (listRes.data.messages && listRes.data.messages.length > 0) {
            messages.push(...listRes.data.messages);
            scanState.totalFound = messages.length;
            scanState.currentStep = `Found ${messages.length.toLocaleString()} inbox messages...`;
          }

          nextPageToken = listRes.data.nextPageToken || undefined;
        } while (nextPageToken && messages.length < scanLimit);

        // Fallback search if in:inbox returned 0 messages
        if (messages.length === 0) {
          scanState.currentStep = 'Searching full mailbox folders...';
          let fallbackPageToken: string | undefined = undefined;
          do {
            const listResAll: any = await gmail.users.messages.list({
              userId: 'me',
              maxResults: 500,
              pageToken: fallbackPageToken,
              q: '-in:trash -in:spam',
            });

            if (listResAll.data.messages && listResAll.data.messages.length > 0) {
              messages.push(...listResAll.data.messages);
              scanState.totalFound = messages.length;
              scanState.currentStep = `Found ${messages.length.toLocaleString()} mailbox messages...`;
            }

            fallbackPageToken = listResAll.data.nextPageToken || undefined;
          } while (fallbackPageToken && messages.length < scanLimit);
        }

        scanState.totalFound = messages.length;
        scanState.progressPercent = 15;

        // Clear existing DB table for fresh scan for this user
        if (db) {
          if (userEmail) {
            db.run(`DELETE FROM email_metadata WHERE userEmail = ?`, [userEmail]);
          } else {
            db.run(`DELETE FROM email_metadata`);
          }
          saveDBToDisk();
        }

        if (messages.length === 0) {
          scanState.status = 'completed';
          scanState.progressPercent = 100;
          scanState.currentStep = 'Inbox scan complete!';
          return;
        }

        // Step 2: Fetch metadata in parallel batches
        const BATCH_SIZE = 50;
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
                    `INSERT OR REPLACE INTO email_metadata (id, userEmail, threadId, sender, senderEmail, subject, snippet, date, timestamp, size, labelIds, category, hasAttachment, isUnread, isImportant, isStarred, unsubscribeUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      msgData.id,
                      userEmail,
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
          scanState.progressPercent = Math.min(95, Math.round(15 + ((i + batch.length) / messages.length) * 80));

          // Periodically flush database to disk every 500 emails
          if ((i + BATCH_SIZE) % 500 === 0) {
            saveDBToDisk();
          }
        }

        saveDBToDisk();

        scanState.status = 'completed';
        scanState.progressPercent = 100;
        scanState.currentStep = 'Mailbox analysis complete!';

        // Send Email Report if enabled
        if (sendEmailReport && userEmail && gmail) {
          try {
            const reportSubject = `InboxIQ Scan Report: ${messages.length.toLocaleString()} Emails Processed`;
            const reportHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
                <div style="margin-bottom: 20px;">
                  <span style="font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em;">InboxIQ Intelligence Report</span>
                  <h2 style="color: #0f172a; margin: 6px 0 0 0; font-size: 22px;">Inbox Scan Completed Successfully 🎉</h2>
                </div>

                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                  Your mailbox scan is finished! Your scan data is saved under <strong>${userEmail}</strong> and ready for cleanup.
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 20px 0;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #64748b; font-size: 13px;">Total Analyzed Messages:</span>
                    <strong style="color: #0f172a; font-size: 14px;">${messages.length.toLocaleString()}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b; font-size: 13px;">Account:</span>
                    <strong style="color: #0f172a; font-size: 14px;">${userEmail}</strong>
                  </div>
                </div>

                <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                  You can log back into your InboxIQ account at any time to run batch deletes, clean out old unread newsletters, or execute mass query clearances.
                </p>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                  Sent automatically by InboxIQ Email Management System.
                </p>
              </div>
            `;

            const rawMessage = [
              `To: ${userEmail}`,
              `Subject: ${reportSubject}`,
              'Content-Type: text/html; charset=utf-8',
              '',
              reportHtml,
            ].join('\r\n');

            const encodedMessage = Buffer.from(rawMessage)
              .toString('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');

            await gmail.users.messages.send({
              userId: 'me',
              requestBody: {
                raw: encodedMessage,
              },
            });
            console.log(`Scan completion summary email sent to ${userEmail}`);
          } catch (emailErr) {
            console.error('Failed to send completion email:', emailErr);
          }
        }
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

// 8. Execute Mass Direct Query Clearance (Fast 60k Clear)
app.post('/api/mass-clear', async (req, res) => {
  const { query, action } = req.body as { query: string; action: 'delete' | 'archive' };

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  if (req.session.isDemo) {
    return res.json({ success: true, clearedCount: 1250 });
  }

  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const { client: oauth2Client } = getOAuth2Client(req);
    oauth2Client.setCredentials(req.session.tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Page through all messages matching the query
    let matchingIds: string[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const listRes: any = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 500,
        pageToken: nextPageToken,
        q: query,
      });

      if (listRes.data.messages && listRes.data.messages.length > 0) {
        matchingIds.push(...listRes.data.messages.map((m: any) => m.id));
      }

      nextPageToken = listRes.data.nextPageToken || undefined;
    } while (nextPageToken && matchingIds.length < 100000);

    if (matchingIds.length === 0) {
      return res.json({ success: true, clearedCount: 0 });
    }

    // Process batchModify in chunks of 1000
    for (let i = 0; i < matchingIds.length; i += 1000) {
      const chunk = matchingIds.slice(i, i + 1000);
      if (action === 'delete') {
        await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: chunk,
            addLabelIds: ['TRASH'],
            removeLabelIds: ['INBOX'],
          },
        });
      } else {
        await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: chunk,
            removeLabelIds: ['INBOX'],
          },
        });
      }
    }

    // Delete cleared entries from SQLite DB as well
    if (db) {
      const placeholders = matchingIds.map(() => '?').join(',');
      db.run(`DELETE FROM email_metadata WHERE id IN (${placeholders})`, matchingIds);
      saveDBToDisk();
    }

    res.json({ success: true, clearedCount: matchingIds.length });
  } catch (err: any) {
    console.error('Mass clear error:', err);
    res.status(500).json({ error: err.message || 'Failed to mass clear emails' });
  }
});

// 9. Execute Batch Actions (Trash / Archive)
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

    // Process in chunks of 1000 to observe Gmail API batchModify limit
    for (let i = 0; i < messageIds.length; i += 1000) {
      const chunk = messageIds.slice(i, i + 1000);
      if (action === 'delete') {
        await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: chunk,
            addLabelIds: ['TRASH'],
            removeLabelIds: ['INBOX'],
          },
        });
      } else if (action === 'archive') {
        await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: chunk,
            removeLabelIds: ['INBOX'],
          },
        });
      }
    }

    // Delete cleared entries from SQLite DB as well
    if (db) {
      const placeholders = messageIds.map(() => '?').join(',');
      db.run(`DELETE FROM email_metadata WHERE id IN (${placeholders})`, messageIds);
      saveDBToDisk();
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
