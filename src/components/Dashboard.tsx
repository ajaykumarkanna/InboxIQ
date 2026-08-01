import React from 'react';
import { InboxStats, CategoryId, CategoryInfo } from '../types';
import { formatBytes } from '../lib/demoData';
import {
  Tag,
  Users,
  ShoppingBag,
  Landmark,
  Plane,
  KeyRound,
  Code2,
  Paperclip,
  Newspaper,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Inbox,
  HardDrive,
  Trash2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface DashboardProps {
  stats: InboxStats;
  onSelectCategory: (catId: CategoryId) => void;
  onStartScan: () => void;
  onSelectSender?: (senderEmail: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Tag,
  Users,
  ShoppingBag,
  Landmark,
  Plane,
  KeyRound,
  Code2,
  Paperclip,
  Newspaper,
  Clock,
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, onSelectCategory, onStartScan, onSelectSender }) => {
  const getHealthBadge = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Excellent',
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
        ring: 'text-emerald-500',
      };
    } else if (score >= 65) {
      return {
        label: 'Good',
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
        ring: 'text-blue-500',
      };
    } else if (score >= 40) {
      return {
        label: 'Needs Cleanup',
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
        ring: 'text-amber-500',
      };
    } else {
      return {
        label: 'Critical',
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
        ring: 'text-rose-500',
      };
    }
  };

  const healthBadge = getHealthBadge(stats.healthScore);
  const categoriesList: CategoryInfo[] = Object.values(stats.categories);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner: Inbox Health Score & Primary Metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Health Score Gauge */}
          <div className="flex items-center space-x-6 w-full lg:w-auto">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`${healthBadge.ring} transition-all duration-700 ease-out`}
                  strokeWidth="10"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * stats.healthScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">
                  {stats.healthScore}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  /100
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2.5 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Inbox Health Score
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${healthBadge.bg}`}>
                  {stats.healthStatus}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                Calculated based on unread ratios, old promo clutter, and recoverable storage footprint.
              </p>
              {stats.scannedAt && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Last analyzed at {stats.scannedAt}
                </p>
              )}
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="inline-flex p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2">
                <Inbox className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Unread Messages</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.unreadCount.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="inline-flex p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                <HardDrive className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Recoverable Space</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatBytes(stats.recoverableSize)}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="inline-flex p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
                <Trash2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cleanup Candidates</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.recoverableCount.toLocaleString()}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Section 1: Cleanup Opportunity Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cleanup Opportunities
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a card to review specific emails, select items, and run bulk actions safely.
            </p>
          </div>
          <button
            onClick={onStartScan}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Refresh Scan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriesList.map((cat) => {
            const IconComp = ICON_MAP[cat.iconName] || Tag;
            const isEmpty = cat.count === 0;

            return (
              <div
                key={cat.id}
                className={`bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 ${
                  isEmpty ? 'opacity-60' : ''
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl border ${cat.color}`}>
                      <IconComp className="h-5 w-5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cat.badgeColor}`}>
                      {cat.safetyScore}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                    {cat.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                {/* Card Footer */}
                <div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs mb-4">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {cat.count.toLocaleString()}
                      </span>
                      <span className="text-slate-400 ml-1">emails</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatBytes(cat.totalSize)}
                      </span>
                      {cat.oldestDate && (
                        <span className="text-slate-400 text-[10px] block">
                          Oldest: {cat.oldestDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {isEmpty ? (
                    <div className="w-full py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center text-xs font-medium text-slate-400">
                      Clean! Zero messages 🎉
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectCategory(cat.id)}
                      className="w-full py-2 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <span>Review Messages</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Top Senders Leaderboard */}
      {stats.topSenders && stats.topSenders.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Top Mailbox Senders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Senders generating the highest email volume in your inbox.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.topSenders.map((sender, idx) => (
              <div
                key={sender.email}
                className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0 text-sm"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 text-center font-bold text-slate-400 dark:text-slate-500 text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {sender.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {sender.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                      {sender.count.toLocaleString()} emails
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatBytes(sender.totalSize)}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectCategory(sender.category)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Review category"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
