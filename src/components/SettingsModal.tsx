import React from 'react';
import { AppSettings, UserProfile } from '../types';
import { X, Moon, Sun, ShieldCheck, Trash2, Archive, LogOut, Sliders, Database } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  user: UserProfile | null;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  user,
  onUpdateSettings,
  onClose,
  onLogout,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Sliders className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              InboxIQ Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-4 text-xs">
          
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Dark Theme</p>
              <p className="text-slate-500 dark:text-slate-400">Toggle dark color scheme preference</p>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, darkMode: !settings.darkMode })}
              className={`p-2 rounded-lg transition-colors ${
                settings.darkMode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>

          {/* Default Action */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Default Bulk Action</p>
              <p className="text-slate-500 dark:text-slate-400">Choose preferred action for cleanup cards</p>
            </div>
            <div className="flex items-center space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => onUpdateSettings({ ...settings, defaultAction: 'archive' })}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  settings.defaultAction === 'archive'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Archive
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, defaultAction: 'delete' })}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  settings.defaultAction === 'delete'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Confirmation Safety Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Require Confirmation</p>
              <p className="text-slate-500 dark:text-slate-400">Show safety dialog before bulk deletion</p>
            </div>
            <input
              type="checkbox"
              checked={settings.confirmBeforeDelete}
              onChange={(e) => onUpdateSettings({ ...settings, confirmBeforeDelete: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Auto Exclude Starred & Important */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">Auto-Protect Starred & Important</p>
              <p className="text-slate-500 dark:text-slate-400">Excludes starred messages from auto-selection</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoExcludeStarred}
              onChange={(e) => onUpdateSettings({ ...settings, autoExcludeStarred: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

        </div>

        {/* User Account Info */}
        {user && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center space-x-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Disconnect Account</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
