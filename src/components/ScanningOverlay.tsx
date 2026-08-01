import React from 'react';
import { ScanProgress } from '../types';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScanningOverlayProps {
  progress: ScanProgress;
  onCancel?: () => void;
}

export const ScanningOverlay: React.FC<ScanningOverlayProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative overflow-hidden">
        
        {/* Animated Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon / Circular Progress */}
        <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-indigo-500 transition-all duration-300 ease-out"
              strokeWidth="8"
              strokeDasharray={263.89}
              strokeDashoffset={263.89 - (263.89 * progress.progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse mb-1" />
            <span className="text-xl font-bold text-white tracking-tight">
              {progress.progressPercent}%
            </span>
          </div>
        </div>

        {/* Header Title */}
        <h2 className="text-xl font-bold text-white mb-1">
          {progress.status === 'completed' ? 'Scan Completed!' : 'Scanning Gmail Mailbox...'}
        </h2>
        
        <p className="text-sm text-slate-400 mb-6">
          {progress.currentStep || 'Analyzing header metadata and categories...'}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>

        {/* Scanned Counter Badges */}
        <div className="flex items-center justify-around bg-slate-850/80 p-3 rounded-xl border border-slate-800 text-xs">
          <div>
            <p className="text-slate-500">Scanned Headers</p>
            <p className="text-sm font-bold text-slate-200">{progress.scannedCount.toLocaleString()}</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <p className="text-slate-500">Inbox Total</p>
            <p className="text-sm font-bold text-slate-200">{progress.totalFound.toLocaleString()}</p>
          </div>
        </div>

        {progress.status === 'error' && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span className="truncate">{progress.errorMessage || 'Scan interrupted.'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
