import React from 'react';
import { UserProfile, InboxStats } from '../types';
import { Mail, ShieldCheck, Settings, LogOut, Sun, Moon, Sparkles, AlertCircle } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  isDemo: boolean;
  stats: InboxStats | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onStartScan: () => void;
  onConnectGmail: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isDemo,
  stats,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onLogout,
  onStartScan,
  onConnectGmail,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:to-purple-300">
                InboxIQ
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                MVP v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              AI-Assisted Gmail Cleanup
            </p>
          </div>
        </div>

        {/* Center: Health Score Badge (if logged in & scanned) */}
        {user && stats && (
          <div className="hidden md:flex items-center space-x-3 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Inbox Health:</span>
              <span
                className={`font-bold ${
                  stats.healthScore >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : stats.healthScore >= 60
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {stats.healthScore}/100 ({stats.healthStatus})
              </span>
            </div>
            <button
              onClick={onStartScan}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Rescan</span>
            </button>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Demo Mode Indicator Tag */}
          {isDemo && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Sandbox Demo Mode
            </span>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User Profile / Connect CTA */}
          {user ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="InboxIQ Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <img
                  src={user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={user.name}
                  className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onConnectGmail}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-colors flex items-center space-x-1.5"
            >
              <Mail className="h-4 w-4" />
              <span>Connect Gmail</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
