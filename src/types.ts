export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  connectedAt?: string;
}

export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  date: string;
  timestamp: number;
  size: number; // in bytes
  labelIds: string[];
  category: CategoryId;
  hasAttachment: boolean;
  isUnread: boolean;
  isImportant: boolean;
  isStarred: boolean;
  unsubscribeUrl?: string;
}

export type CategoryId =
  | 'promotions'
  | 'social'
  | 'shopping'
  | 'finance'
  | 'travel'
  | 'otp'
  | 'dev_notifications'
  | 'large_attachments'
  | 'unread_newsletters'
  | 'old_unread';

export interface CategoryInfo {
  id: CategoryId;
  title: string;
  description: string;
  count: number;
  totalSize: number; // bytes
  oldestDate?: string;
  iconName: string;
  color: string;
  safetyScore: '100% Safe' | 'Recommended' | 'Review Carefully';
  badgeColor: string;
}

export interface TopSender {
  name: string;
  email: string;
  count: number;
  totalSize: number;
  category: CategoryId;
}

export interface InboxStats {
  totalMessages: number;
  totalSize: number;
  unreadCount: number;
  healthScore: number;
  healthStatus: 'Excellent' | 'Good' | 'Needs Cleanup' | 'Critical';
  recoverableSize: number;
  recoverableCount: number;
  categories: Record<CategoryId, CategoryInfo>;
  topSenders: TopSender[];
  scannedAt?: string;
}

export interface ScanProgress {
  status: 'idle' | 'scanning' | 'analyzing' | 'completed' | 'error';
  scannedCount: number;
  totalFound: number;
  currentStep: string;
  progressPercent: number;
  errorMessage?: string;
}

export interface AppSettings {
  darkMode: boolean;
  confirmBeforeDelete: boolean;
  defaultAction: 'archive' | 'delete';
  autoExcludeStarred: boolean;
  autoExcludeImportant: boolean;
  largeAttachmentMinMB: number;
  oldUnreadMonths: number;
  scanLimit: number; // Max messages to scan (e.g. 5000, 15000, 50000, 100000)
}

export interface PendingAction {
  id: string;
  type: 'delete' | 'archive';
  categoryTitle: string;
  messageIds: string[];
  emailCount: number;
  sizeBytes: number;
  expiresAt: number;
}
