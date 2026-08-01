import React, { useState, useMemo } from 'react';
import { EmailMessage, CategoryInfo } from '../types';
import { formatBytes } from '../lib/demoData';
import {
  X,
  Search,
  CheckSquare,
  Square,
  Trash2,
  Archive,
  ShieldCheck,
  Star,
  AlertCircle,
  Paperclip,
  ExternalLink,
  ChevronLeft,
  Filter,
} from 'lucide-react';

interface ReviewModalProps {
  category: CategoryInfo;
  emails: EmailMessage[];
  onClose: () => void;
  onExecuteAction: (type: 'delete' | 'archive', selectedIds: string[], totalBytes: number) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  category,
  emails,
  onClose,
  onExecuteAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Default select all non-starred, non-important emails for high safety
    const safeSet = new Set<string>();
    emails.forEach((e) => {
      if (!e.isStarred && !e.isImportant) {
        safeSet.add(e.id);
      }
    });
    return safeSet;
  });

  // Filtered emails based on search & unread toggle
  const filteredEmails = useMemo(() => {
    return emails.filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        e.sender.toLowerCase().includes(q) ||
        e.senderEmail.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.snippet.toLowerCase().includes(q);

      const matchesUnread = !filterUnreadOnly || e.isUnread;
      return matchesSearch && matchesUnread;
    });
  }, [emails, searchQuery, filterUnreadOnly]);

  const isAllSelected = filteredEmails.length > 0 && filteredEmails.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds);
      filteredEmails.forEach((e) => next.delete(e.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredEmails.forEach((e) => next.add(e.id));
      setSelectedIds(next);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Selected totals
  const selectedCount = selectedIds.size;
  const selectedBytes = useMemo(() => {
    let bytes = 0;
    emails.forEach((e) => {
      if (selectedIds.has(e.id)) {
        bytes += e.size;
      }
    });
    return bytes;
  }, [emails, selectedIds]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Reviewing: {category.title}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${category.badgeColor}`}>
                  {category.safetyScore}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {emails.length.toLocaleString()} total messages ({formatBytes(category.totalSize)})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar: Search, Filters & Safety Notice */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
          
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by sender or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Controls & Select All */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
                  filterUnreadOnly
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Unread Only</span>
              </button>

              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>{isAllSelected ? 'Deselect Page' : 'Select All Safe'}</span>
              </button>
            </div>
          </div>

          {/* Safety Protection Shield */}
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Safety Guard Active:</strong> Starred and Important items are automatically excluded from default selection to prevent accidental loss.
            </span>
          </div>
        </div>

        {/* Email Message List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-4">
          {filteredEmails.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-base font-semibold text-slate-600 dark:text-slate-300 mb-1">
                No matching emails found
              </p>
              <p className="text-xs">Try clearing search filters or selecting another category.</p>
            </div>
          ) : (
            filteredEmails.map((msg) => {
              const isSelected = selectedIds.has(msg.id);
              return (
                <div
                  key={msg.id}
                  onClick={() => toggleSelect(msg.id)}
                  className={`p-3 sm:p-4 rounded-xl cursor-pointer transition-colors flex items-start space-x-3 ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-850 border border-transparent'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <div className="pt-0.5">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  {/* Message Content Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className={`font-bold text-sm truncate ${msg.isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {msg.sender}
                        </span>
                        <span className="text-xs text-slate-400 truncate hidden sm:inline">
                          &lt;{msg.senderEmail}&gt;
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 shrink-0 text-xs text-slate-400">
                        {msg.hasAttachment && <Paperclip className="h-3.5 w-3.5 text-slate-400" />}
                        {msg.isStarred && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                        <span>{msg.date}</span>
                      </div>
                    </div>

                    <p className={`text-xs font-medium mb-1 truncate ${msg.isUnread ? 'text-slate-900 dark:text-slate-100 font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>
                      {msg.subject}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {msg.snippet}
                    </p>
                  </div>

                  {/* Size Indicator */}
                  <div className="text-right shrink-0 font-medium text-xs text-slate-400">
                    {formatBytes(msg.size)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-300 text-center sm:text-left">
            <span>Selected: </span>
            <strong className="text-indigo-600 dark:text-indigo-400">{selectedCount} emails</strong>
            <span className="text-slate-400"> ({formatBytes(selectedBytes)} storage recovery)</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              disabled={selectedCount === 0}
              onClick={() => onExecuteAction('archive', Array.from(selectedIds), selectedBytes)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              <span>Archive ({selectedCount})</span>
            </button>

            <button
              disabled={selectedCount === 0}
              onClick={() => onExecuteAction('delete', Array.from(selectedIds), selectedBytes)}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Move to Trash ({selectedCount})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
