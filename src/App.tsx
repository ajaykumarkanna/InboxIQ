import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserProfile,
  EmailMessage,
  InboxStats,
  ScanProgress,
  CategoryId,
  AppSettings,
  PendingAction,
} from './types';
import { generateDemoEmails, computeInboxStats } from './lib/demoData';
import { Navbar } from './components/Navbar';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { ReviewModal } from './components/ReviewModal';
import { ScanningOverlay } from './components/ScanningOverlay';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { UndoToast } from './components/UndoToast';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Email Dataset
  const [allMessages, setAllMessages] = useState<EmailMessage[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<CategoryId | null>(null);

  // Scan progress state
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle',
    scannedCount: 0,
    totalFound: 0,
    currentStep: 'Idle',
    progressPercent: 0,
  });

  // Dialogs & Modals
  const [showSettings, setShowSettings] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{
    type: 'delete' | 'archive';
    categoryTitle: string;
    messageIds: string[];
    sizeBytes: number;
  } | null>(null);

  // Pending undo safeguard
  const [pendingUndo, setPendingUndo] = useState<PendingAction | null>(null);
  const [removedMessagesBackup, setRemovedMessagesBackup] = useState<EmailMessage[]>([]);

  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: true,
    confirmBeforeDelete: true,
    defaultAction: 'archive',
    autoExcludeStarred: true,
    autoExcludeImportant: true,
    largeAttachmentMinMB: 5,
    oldUnreadMonths: 12,
    scanLimit: 50000,
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Helper for Session Headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('inboxiq_token');
    return token ? { 'x-session-token': token } : {};
  }, []);

  // Fetch scanned live emails from backend
  const fetchScannedEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/emails', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAllMessages(data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch scanned emails:', err);
    }
  }, [getAuthHeaders]);

  // Check auth status on load
  const checkAuthStatus = useCallback(async () => {
    try {
      // Check query param for redirect token
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('auth_token');
      if (tokenFromUrl) {
        localStorage.setItem('inboxiq_token', tokenFromUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const res = await fetch('/api/auth/status', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setIsDemo(!!data.isDemo);
        if (data.token) {
          localStorage.setItem('inboxiq_token', data.token);
        }

        // Load dataset
        if (data.isDemo) {
          const msgs = generateDemoEmails();
          setAllMessages(msgs);
        } else {
          await fetchScannedEmails();
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to check auth status:', err);
    } finally {
      setAuthLoading(false);
    }
  }, [getAuthHeaders, fetchScannedEmails]);

  useEffect(() => {
    checkAuthStatus();

    // Listen for OAuth popup message
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'OAUTH_SUCCESS') {
        if (e.data.token) {
          localStorage.setItem('inboxiq_token', e.data.token);
        }
        if (e.data.user) {
          setUser(e.data.user);
          setIsDemo(false);
        }
        checkAuthStatus();
        triggerScan();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [checkAuthStatus]);

  // Connect Google OAuth Popup
  const handleConnectGmail = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      '/api/auth/google',
      'InboxIQ Google Login',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );
  };

  // Launch Instant Demo Mode
  const handleTryDemo = async () => {
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('inboxiq_token', data.token);
      }
      const msgs = generateDemoEmails();
      setAllMessages(msgs);
      setIsDemo(true);
      setUser(data.user || {
        id: 'demo_user',
        name: 'Demo Workspace User',
        email: 'user.demo@gmail.com',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      });
      triggerScan();
    } catch (err) {
      console.error('Failed to start demo:', err);
    }
  };

  // Trigger Scanner
  const triggerScan = async (overrideLimit?: number, sendEmailReport: boolean = true) => {
    const limit = overrideLimit || settings.scanLimit || 100000;
    setScanProgress({
      status: 'scanning',
      scannedCount: 0,
      totalFound: isDemo ? 3820 : limit,
      currentStep: 'Initiating scanning pipeline...',
      progressPercent: 5,
    });

    try {
      if (isDemo) {
        // Simulated progress steps for Demo Mode
        const steps = [
          { percent: 25, count: 950, step: 'Fetching header metadata...' },
          { percent: 55, count: 2100, step: 'Analyzing senders & unsubscribes...' },
          { percent: 85, count: 3200, step: 'Classifying categories & size metrics...' },
          { percent: 100, count: 3820, step: 'Mailbox scan complete!' },
        ];

        for (const s of steps) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setScanProgress((prev) => ({
            ...prev,
            status: s.percent === 100 ? 'completed' : 'scanning',
            scannedCount: s.count,
            progressPercent: s.percent,
            currentStep: s.step,
          }));
        }

        setTimeout(() => {
          setScanProgress((prev) => ({ ...prev, status: 'idle' }));
        }, 800);
      } else {
        // Live Google API scan
        await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ limit, sendEmailReport }),
        });
        
        // Poll for progress
        const pollTimer = setInterval(async () => {
          try {
            const pRes = await fetch('/api/scan/progress', { headers: getAuthHeaders() });
            const pData = await pRes.json();
            setScanProgress(pData);

            if (pData.status === 'completed' || pData.status === 'error') {
              clearInterval(pollTimer);
              if (pData.status === 'completed') {
                await fetchScannedEmails();
              }
              setTimeout(() => {
                setScanProgress((prev) => ({ ...prev, status: 'idle' }));
              }, 1000);
            }
          } catch (e) {
            console.warn('Poll error:', e);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to trigger scan:', err);
      setScanProgress((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Failed to start scan',
      }));
    }
  };

  // Mass direct query clear for 60k+ inboxes
  const handleMassClear = async (query: string, action: 'delete' | 'archive') => {
    setScanProgress({
      status: 'scanning',
      scannedCount: 0,
      totalFound: 0,
      currentStep: `Bulk clearing matching query: "${query}"...`,
      progressPercent: 20,
    });

    try {
      const res = await fetch('/api/mass-clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ query, action }),
      });
      const data = await res.json();
      if (data.success) {
        setScanProgress({
          status: 'completed',
          scannedCount: data.clearedCount,
          totalFound: data.clearedCount,
          currentStep: `Successfully ${action === 'delete' ? 'deleted' : 'archived'} ${data.clearedCount.toLocaleString()} emails!`,
          progressPercent: 100,
        });
        await fetchScannedEmails();
        setTimeout(() => {
          setScanProgress((prev) => ({ ...prev, status: 'idle' }));
        }, 1500);
      }
    } catch (err) {
      console.error('Mass clear error:', err);
      setScanProgress({
        status: 'error',
        scannedCount: 0,
        totalFound: 0,
        currentStep: 'Failed to mass clear',
        progressPercent: 0,
        errorMessage: 'Failed to execute mass clear query',
      });
    }
  };

  // Logout / Disconnect
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {
      console.warn(e);
    }
    localStorage.removeItem('inboxiq_token');
    setUser(null);
    setIsDemo(false);
    setAllMessages([]);
    setActiveCategoryId(null);
  };

  // Compute live Inbox Stats
  const stats = useMemo(() => {
    return computeInboxStats(allMessages);
  }, [allMessages]);

  // Request batch action execution
  const handleRequestBatchAction = (
    type: 'delete' | 'archive',
    selectedIds: string[],
    totalBytes: number
  ) => {
    if (!activeCategoryId) return;
    const catInfo = stats.categories[activeCategoryId];

    if (settings.confirmBeforeDelete) {
      setConfirmationState({
        type,
        categoryTitle: catInfo.title,
        messageIds: selectedIds,
        sizeBytes: totalBytes,
      });
    } else {
      executeBatchAction(type, selectedIds, totalBytes, catInfo.title);
    }
  };

  // Execute batch action (Delete/Archive)
  const executeBatchAction = async (
    type: 'delete' | 'archive',
    messageIds: string[],
    sizeBytes: number,
    categoryTitle: string
  ) => {
    // 1. Save backup for undo
    const backup = allMessages.filter((m) => messageIds.includes(m.id));
    setRemovedMessagesBackup(backup);

    // 2. Remove from active state immediately
    setAllMessages((prev) => prev.filter((m) => !messageIds.includes(m.id)));
    setActiveCategoryId(null);
    setConfirmationState(null);

    // 3. Set up 30-second undo toast
    const pending: PendingAction = {
      id: `act_${Date.now()}`,
      type,
      categoryTitle,
      messageIds,
      emailCount: messageIds.length,
      sizeBytes,
      expiresAt: Date.now() + 30000,
    };
    setPendingUndo(pending);

    // 4. Send API call to backend (or handles in demo)
    try {
      await fetch('/api/batch-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action: type, messageIds }),
      });
    } catch (err) {
      console.warn('API batch action error:', err);
    }
  };

  // Handle Undo Action
  const handleUndo = () => {
    if (removedMessagesBackup.length > 0) {
      setAllMessages((prev) => [...prev, ...removedMessagesBackup]);
      setRemovedMessagesBackup([]);
    }
    setPendingUndo(null);
  };

  const activeCategoryInfo = activeCategoryId ? stats.categories[activeCategoryId] : null;
  const activeCategoryMessages = useMemo(() => {
    if (!activeCategoryId) return [];
    return allMessages.filter((m) => m.category === activeCategoryId);
  }, [allMessages, activeCategoryId]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors">
      
      {/* Header Bar */}
      <Navbar
        user={user}
        isDemo={isDemo}
        stats={user ? stats : null}
        darkMode={settings.darkMode}
        onToggleDarkMode={() => setSettings((s) => ({ ...s, darkMode: !s.darkMode }))}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
        onStartScan={triggerScan}
        onConnectGmail={handleConnectGmail}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {authLoading ? (
          <div className="py-24 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-slate-500">Initializing InboxIQ...</p>
          </div>
        ) : !user ? (
          <Landing onConnectGmail={handleConnectGmail} onTryDemo={handleTryDemo} />
        ) : (
          <Dashboard
            stats={stats}
            onSelectCategory={(catId) => setActiveCategoryId(catId)}
            onStartScan={triggerScan}
            onMassClear={handleMassClear}
          />
        )}
      </main>

      {/* Active Modals & Overlays */}
      {scanProgress.status === 'scanning' && (
        <ScanningOverlay
          progress={scanProgress}
          userEmail={user?.email}
          onDismiss={() => setScanProgress((prev) => ({ ...prev, status: 'idle' }))}
        />
      )}

      {activeCategoryInfo && (
        <ReviewModal
          category={activeCategoryInfo}
          emails={activeCategoryMessages}
          onClose={() => setActiveCategoryId(null)}
          onExecuteAction={handleRequestBatchAction}
        />
      )}

      {confirmationState && (
        <ConfirmationDialog
          type={confirmationState.type}
          categoryTitle={confirmationState.categoryTitle}
          count={confirmationState.messageIds.length}
          sizeBytes={confirmationState.sizeBytes}
          onConfirm={() =>
            executeBatchAction(
              confirmationState.type,
              confirmationState.messageIds,
              confirmationState.sizeBytes,
              confirmationState.categoryTitle
            )
          }
          onCancel={() => setConfirmationState(null)}
        />
      )}

      {pendingUndo && (
        <UndoToast
          action={pendingUndo}
          onUndo={handleUndo}
          onExpire={() => setPendingUndo(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          user={user}
          onUpdateSettings={setSettings}
          onClose={() => setShowSettings(false)}
          onLogout={() => {
            setShowSettings(false);
            handleLogout();
          }}
        />
      )}

    </div>
  );
}
