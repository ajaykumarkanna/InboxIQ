import React, { useEffect, useState } from 'react';
import { PendingAction } from '../types';
import { formatBytes } from '../lib/demoData';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

interface UndoToastProps {
  action: PendingAction;
  onUndo: () => void;
  onExpire: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ action, onUndo, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onExpire]);

  const isDelete = action.type === 'delete';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border border-slate-700 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between space-x-4 animate-slide-up">
      
      {/* Left: Info */}
      <div className="flex items-center space-x-3 min-w-0">
        <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-amber-400 transition-all duration-1000 ease-linear"
              strokeDasharray={`${(timeLeft / 30) * 100}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-xs font-bold text-amber-300">
            {timeLeft}s
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-100 truncate">
            {isDelete ? 'Moved to Trash' : 'Archived'} {action.emailCount.toLocaleString()} emails
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {formatBytes(action.sizeBytes)} storage freed • {action.categoryTitle}
          </p>
        </div>
      </div>

      {/* Right: Undo Button */}
      <button
        onClick={onUndo}
        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center space-x-1.5 shadow-md"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Undo</span>
      </button>

    </div>
  );
};
