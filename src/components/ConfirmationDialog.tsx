import React from 'react';
import { formatBytes } from '../lib/demoData';
import { AlertTriangle, ShieldCheck, Trash2, Archive, X } from 'lucide-react';

interface ConfirmationDialogProps {
  type: 'delete' | 'archive';
  categoryTitle: string;
  count: number;
  sizeBytes: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  type,
  categoryTitle,
  count,
  sizeBytes,
  onConfirm,
  onCancel,
}) => {
  const isDelete = type === 'delete';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Close Icon */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning Icon */}
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 ${
          isDelete
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60'
        }`}>
          {isDelete ? <Trash2 className="h-6 w-6" /> : <Archive className="h-6 w-6" />}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {isDelete ? `Move ${count.toLocaleString()} Emails to Trash?` : `Archive ${count.toLocaleString()} Emails?`}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
          You are about to perform a bulk {type} action on <strong>{categoryTitle}</strong>.
        </p>

        {/* Highlight Stats Box */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-5 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Affected Email Count:</span>
            <span className="font-bold text-slate-900 dark:text-white">{count.toLocaleString()} messages</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estimated Storage Recovery:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(sizeBytes)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Destination:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {isDelete ? 'Gmail Trash (30-day safety retention)' : 'Archive (Removed from Inbox)'}
            </span>
          </div>
        </div>

        {/* Safety Safeguard Note */}
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 mb-6">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>30-Second Undo Available:</strong> A floating notification will allow you to instantly reverse this action.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-white text-xs font-bold shadow-lg transition-colors ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
            }`}
          >
            Confirm {isDelete ? 'Move to Trash' : 'Archive'}
          </button>
        </div>

      </div>
    </div>
  );
};
