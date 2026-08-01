import { EmailMessage, InboxStats, CategoryId, CategoryInfo, TopSender } from '../types';

export function generateDemoEmails(): EmailMessage[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const demoTemplates: Array<{
    sender: string;
    senderEmail: string;
    subject: string;
    snippet: string;
    category: CategoryId;
    baseSize: number;
    daysAgoMin: number;
    daysAgoMax: number;
    isUnreadProb: number;
    count: number;
    hasAttachmentProb?: number;
    isStarredProb?: number;
    isImportantProb?: number;
  }> = [
    {
      sender: 'Amazon.com',
      senderEmail: 'shipment-tracking@amazon.com',
      subject: 'Your order has been shipped!',
      snippet: 'Track your package delivery details for order #114-98234-92834.',
      category: 'shopping',
      baseSize: 45000,
      daysAgoMin: 5,
      daysAgoMax: 700,
      isUnreadProb: 0.6,
      count: 240,
    },
    {
      sender: 'Swiggy Food',
      senderEmail: 'no-reply@swiggy.in',
      subject: 'Flat 50% OFF on your favorite pizza today!',
      snippet: 'Craving something delicious? Order now and save big with code FEAST50.',
      category: 'shopping',
      baseSize: 62000,
      daysAgoMin: 10,
      daysAgoMax: 800,
      isUnreadProb: 0.8,
      count: 310,
    },
    {
      sender: 'LinkedIn',
      senderEmail: 'notifications-noreply@linkedin.com',
      subject: '5 people viewed your profile this week',
      snippet: 'See who is interested in your network and expand your professional connections.',
      category: 'social',
      baseSize: 35000,
      daysAgoMin: 2,
      daysAgoMax: 900,
      isUnreadProb: 0.75,
      count: 420,
    },
    {
      sender: 'Facebook',
      senderEmail: 'notification@facebookmail.com',
      subject: 'You have 12 unread notifications from friends',
      snippet: 'John tagged you in a photo. Comment or react to catch up!',
      category: 'social',
      baseSize: 28000,
      daysAgoMin: 15,
      daysAgoMax: 1000,
      isUnreadProb: 0.85,
      count: 280,
    },
    {
      sender: 'HDFC Bank Security',
      senderEmail: 'alerts@hdfcbank.net',
      subject: 'Your OTP is 849201 for online banking login',
      snippet: 'Do not share your OTP with anyone. Valid for 10 minutes only.',
      category: 'otp',
      baseSize: 12000,
      daysAgoMin: 1,
      daysAgoMax: 500,
      isUnreadProb: 0.3,
      count: 180,
    },
    {
      sender: 'Google Verification',
      senderEmail: 'no-reply@accounts.google.com',
      subject: 'Google Verification Code: 492018',
      snippet: 'Your verification code is 492018. If you did not request this code, please secure your account.',
      category: 'otp',
      baseSize: 15000,
      daysAgoMin: 3,
      daysAgoMax: 600,
      isUnreadProb: 0.25,
      count: 120,
    },
    {
      sender: 'Myntra Fashion',
      senderEmail: 'updates@myntra.com',
      subject: 'End of Reason Sale starts in 2 hours! 80% OFF',
      snippet: 'Wishlist your favorites now and grab top brands at unbeatable prices.',
      category: 'promotions',
      baseSize: 85000,
      daysAgoMin: 1,
      daysAgoMax: 730,
      isUnreadProb: 0.9,
      count: 520,
    },
    {
      sender: 'Uber Receipts',
      senderEmail: 'uber.receipts@uber.com',
      subject: 'Your Friday afternoon trip with Uber',
      snippet: 'Total $24.50. Thanks for riding with Uber. Rate your driver.',
      category: 'travel',
      baseSize: 42000,
      daysAgoMin: 7,
      daysAgoMax: 650,
      isUnreadProb: 0.4,
      count: 190,
    },
    {
      sender: 'Air India',
      senderEmail: 'e-ticket@airindia.in',
      subject: 'E-Ticket Confirmation: Flight AI-802 DEL-BOM',
      snippet: 'Your booking is confirmed. Attached PNR document for flight AI-802.',
      category: 'travel',
      baseSize: 180000,
      daysAgoMin: 30,
      daysAgoMax: 700,
      hasAttachmentProb: 0.9,
      isUnreadProb: 0.3,
      count: 65,
    },
    {
      sender: 'GitHub Notifications',
      senderEmail: 'notifications@github.com',
      subject: '[Repo/core] Pull Request #412 merged: Fix rate limiter middleware',
      snippet: 'PR #412 was successfully merged into main branch by team lead.',
      category: 'dev_notifications',
      baseSize: 31000,
      daysAgoMin: 1,
      daysAgoMax: 400,
      isUnreadProb: 0.5,
      count: 340,
    },
    {
      sender: 'Jira Software',
      senderEmail: 'jira@atlassian.net',
      subject: '[PROJ-891] Issue assigned to you: Implement OAuth refresh flow',
      snippet: 'High priority issue assigned to you. Due date: End of sprint.',
      category: 'dev_notifications',
      baseSize: 29000,
      daysAgoMin: 2,
      daysAgoMax: 450,
      isUnreadProb: 0.45,
      count: 230,
    },
    {
      sender: 'Chase Credit Card',
      senderEmail: 'customer.service@chase.com',
      subject: 'Your Monthly e-Statement is ready for viewing',
      snippet: 'View your account balance and payment due date online.',
      category: 'finance',
      baseSize: 95000,
      daysAgoMin: 15,
      daysAgoMax: 800,
      hasAttachmentProb: 0.8,
      isUnreadProb: 0.35,
      count: 85,
    },
    {
      sender: 'Dropbox Cloud',
      senderEmail: 'no-reply@dropbox.com',
      subject: 'Annual Project Backup Archives (Zip File 14.2 MB)',
      snippet: 'Direct download link for archived asset deliverables and high-res raw images.',
      category: 'large_attachments',
      baseSize: 14800000, // 14.8 MB
      daysAgoMin: 60,
      daysAgoMax: 900,
      hasAttachmentProb: 1.0,
      isUnreadProb: 0.7,
      count: 45,
    },
    {
      sender: 'WeTransfer',
      senderEmail: 'noreply@wetransfer.com',
      subject: 'Files sent to you (Video assets 8.5 MB)',
      snippet: 'Download available for 7 days. Click to retrieve raw footage.',
      category: 'large_attachments',
      baseSize: 8900000, // 8.9 MB
      daysAgoMin: 40,
      daysAgoMax: 800,
      hasAttachmentProb: 1.0,
      isUnreadProb: 0.6,
      count: 55,
    },
    {
      sender: 'Substack Weekly Digest',
      senderEmail: 'digest@substack.com',
      subject: 'The Future of AI Systems - Issue #104',
      snippet: 'Unsubscribe link included. Deep dive into modern model architectures and agents.',
      category: 'unread_newsletters',
      baseSize: 54000,
      daysAgoMin: 10,
      daysAgoMax: 600,
      isUnreadProb: 1.0,
      count: 290,
    },
    {
      sender: 'Medium Daily Digest',
      senderEmail: 'noreply@medium.com',
      subject: 'Top stories in Technology and Product Design for you',
      snippet: 'Unsubscribe anytime. 10 stories selected based on your reading history.',
      category: 'unread_newsletters',
      baseSize: 68000,
      daysAgoMin: 12,
      daysAgoMax: 700,
      isUnreadProb: 1.0,
      count: 360,
    },
    {
      sender: 'Coursera Education',
      senderEmail: 'no-reply@coursera.org',
      subject: 'Complete your course assignment in Deep Learning',
      snippet: 'Your deadline is approaching. Log in to submit your quiz.',
      category: 'old_unread',
      baseSize: 38000,
      daysAgoMin: 380, // > 1 year
      daysAgoMax: 1100,
      isUnreadProb: 1.0,
      count: 410,
    },
  ];

  const messages: EmailMessage[] = [];
  let idCounter = 1000;

  for (const tmpl of demoTemplates) {
    for (let i = 0; i < tmpl.count; i++) {
      idCounter++;
      const daysAgo = tmpl.daysAgoMin + Math.random() * (tmpl.daysAgoMax - tmpl.daysAgoMin);
      const timestamp = Math.floor(now - daysAgo * dayMs);
      const isUnread = Math.random() < tmpl.isUnreadProb;
      const isStarred = tmpl.isStarredProb ? Math.random() < tmpl.isStarredProb : Math.random() < 0.03;
      const isImportant = tmpl.isImportantProb ? Math.random() < tmpl.isImportantProb : Math.random() < 0.05;
      const hasAttachment = tmpl.hasAttachmentProb ? Math.random() < tmpl.hasAttachmentProb : Math.random() < 0.1;
      const size = Math.floor(tmpl.baseSize * (0.8 + Math.random() * 0.4));

      const dateStr = new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      messages.push({
        id: `msg_demo_${idCounter}`,
        threadId: `thread_${idCounter}`,
        sender: tmpl.sender,
        senderEmail: tmpl.senderEmail,
        subject: tmpl.subject + (i > 0 ? ` (#${i + 1})` : ''),
        snippet: tmpl.snippet,
        date: dateStr,
        timestamp,
        size,
        labelIds: [
          'INBOX',
          tmpl.category === 'promotions' ? 'CATEGORY_PROMOTIONS' : '',
          tmpl.category === 'social' ? 'CATEGORY_SOCIAL' : '',
          isUnread ? 'UNREAD' : '',
          isStarred ? 'STARRED' : '',
          isImportant ? 'IMPORTANT' : '',
        ].filter(Boolean),
        category: tmpl.category,
        hasAttachment,
        isUnread,
        isImportant,
        isStarred,
        unsubscribeUrl: tmpl.category === 'unread_newsletters' ? 'https://example.com/unsubscribe' : undefined,
      });
    }
  }

  return messages;
}

export function computeInboxStats(messages: EmailMessage[]): InboxStats {
  const categoriesMap: Record<CategoryId, CategoryInfo> = {
    promotions: {
      id: 'promotions',
      title: 'Old Promotions',
      description: 'Marketing deals, coupons, and sales offers',
      count: 0,
      totalSize: 0,
      iconName: 'Tag',
      color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50 dark:text-amber-400',
      safetyScore: '100% Safe',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    social: {
      id: 'social',
      title: 'Social Notifications',
      description: 'Facebook, LinkedIn, Twitter & community updates',
      count: 0,
      totalSize: 0,
      iconName: 'Users',
      color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50 dark:text-blue-400',
      safetyScore: '100% Safe',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    shopping: {
      id: 'shopping',
      title: 'Shopping & Delivery',
      description: 'Amazon, Swiggy, Myntra order updates & promos',
      count: 0,
      totalSize: 0,
      iconName: 'ShoppingBag',
      color: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/50 dark:text-purple-400',
      safetyScore: '100% Safe',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    finance: {
      id: 'finance',
      title: 'Finance & Banking',
      description: 'Bank e-statements, payment receipts, and alerts',
      count: 0,
      totalSize: 0,
      iconName: 'Landmark',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50 dark:text-emerald-400',
      safetyScore: 'Review Carefully',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    travel: {
      id: 'travel',
      title: 'Travel & Bookings',
      description: 'Flight tickets, hotel receipts, and rideshare summaries',
      count: 0,
      totalSize: 0,
      iconName: 'Plane',
      color: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-900/50 dark:text-sky-400',
      safetyScore: 'Recommended',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    otp: {
      id: 'otp',
      title: 'OTP & Verification Codes',
      description: 'Expired login codes, security tokens & 2FA emails',
      count: 0,
      totalSize: 0,
      iconName: 'KeyRound',
      color: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50 dark:text-rose-400',
      safetyScore: '100% Safe',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    dev_notifications: {
      id: 'dev_notifications',
      title: 'Dev & App Notifications',
      description: 'GitHub, Jira, Confluence & Google Drive pings',
      count: 0,
      totalSize: 0,
      iconName: 'Code2',
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900/50 dark:text-indigo-400',
      safetyScore: 'Recommended',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    large_attachments: {
      id: 'large_attachments',
      title: 'Large Attachments (>5MB)',
      description: 'Files, PDFs, video clips & high-res images taking disk space',
      count: 0,
      totalSize: 0,
      iconName: 'Paperclip',
      color: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/50 dark:text-orange-400',
      safetyScore: 'Review Carefully',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    unread_newsletters: {
      id: 'unread_newsletters',
      title: 'Unread Newsletters',
      description: 'Substack, Medium & weekly industry roundups never opened',
      count: 0,
      totalSize: 0,
      iconName: 'Newspaper',
      color: 'bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-900/50 dark:text-teal-400',
      safetyScore: '100% Safe',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    old_unread: {
      id: 'old_unread',
      title: 'Old Unread (>1 Year)',
      description: 'Unopened messages older than 12 months accumulating dust',
      count: 0,
      totalSize: 0,
      iconName: 'Clock',
      color: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-900/50 dark:text-violet-400',
      safetyScore: 'Recommended',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
  };

  const senderCounts: Record<string, { name: string; email: string; count: number; totalSize: number; category: CategoryId }> = {};
  let totalSize = 0;
  let unreadCount = 0;
  let oldestTimestamps: Record<CategoryId, number> = {} as any;

  messages.forEach((msg) => {
    totalSize += msg.size;
    if (msg.isUnread) unreadCount++;

    const cat = categoriesMap[msg.category];
    if (cat) {
      cat.count++;
      cat.totalSize += msg.size;

      if (!oldestTimestamps[msg.category] || msg.timestamp < oldestTimestamps[msg.category]) {
        oldestTimestamps[msg.category] = msg.timestamp;
      }
    }

    if (!senderCounts[msg.senderEmail]) {
      senderCounts[msg.senderEmail] = {
        name: msg.sender,
        email: msg.senderEmail,
        count: 0,
        totalSize: 0,
        category: msg.category,
      };
    }
    senderCounts[msg.senderEmail].count++;
    senderCounts[msg.senderEmail].totalSize += msg.size;
  });

  // Format oldest dates
  (Object.keys(categoriesMap) as CategoryId[]).forEach((catId) => {
    if (oldestTimestamps[catId]) {
      categoriesMap[catId].oldestDate = new Date(oldestTimestamps[catId]).getFullYear().toString();
    }
  });

  const topSenders: TopSender[] = Object.values(senderCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Calculate recoverable metrics (safe categories: promotions, social, shopping, otp, unread_newsletters, old_unread, large_attachments)
  let recoverableCount = 0;
  let recoverableSize = 0;

  Object.values(categoriesMap).forEach((c) => {
    recoverableCount += c.count;
    recoverableSize += c.totalSize;
  });

  // Calculate Health Score (PRD Formula)
  // Higher unread ratio & high clutter reduces health score
  const total = messages.length || 1;
  const unreadRatio = unreadCount / total;
  const promoRatio = (categoriesMap.promotions.count + categoriesMap.social.count + categoriesMap.shopping.count) / total;

  let healthScore = Math.round(100 - unreadRatio * 40 - promoRatio * 35);
  if (healthScore < 20) healthScore = 20;
  if (healthScore > 98) healthScore = 98;

  let healthStatus: InboxStats['healthStatus'] = 'Good';
  if (healthScore >= 85) healthStatus = 'Excellent';
  else if (healthScore >= 65) healthStatus = 'Good';
  else if (healthScore >= 40) healthStatus = 'Needs Cleanup';
  else healthStatus = 'Critical';

  return {
    totalMessages: messages.length,
    totalSize,
    unreadCount,
    healthScore,
    healthStatus,
    recoverableSize,
    recoverableCount,
    categories: categoriesMap,
    topSenders,
    scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
