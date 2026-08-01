import React from 'react';
import { Mail, ShieldCheck, Sparkles, Trash2, Archive, CheckCircle2, Lock, ArrowRight, Database, Play } from 'lucide-react';

interface LandingProps {
  onConnectGmail: () => void;
  onTryDemo: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onConnectGmail, onTryDemo }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      
      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        
        {/* Security Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Private & Safe Metadata Analysis • 100% Zero Body Storage</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.15]">
          Clean Years of Gmail Clutter in Minutes{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:to-purple-300">
            Without Risking Important Emails
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          Overwhelmed by 20,000+ unread emails, promotions, and notifications taking up your Google storage? 
          InboxIQ organizes your mailbox into safe cleanup groups and gives you full preview control.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12">
          <button
            onClick={onConnectGmail}
            className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 group"
          >
            <Mail className="h-5 w-5" />
            <span>Connect Gmail Account</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={onTryDemo}
            className="w-full sm:w-auto px-6 py-4 text-base font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            <Play className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>Try Instant Sandbox Demo</span>
          </button>
        </div>

        {/* Trust Indicators */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
          <div className="flex items-center justify-center space-x-1.5">
            <Lock className="h-4 w-4 text-indigo-500" />
            <span>Google OAuth 2.0</span>
          </div>
          <div className="flex items-center justify-center space-x-1.5">
            <Database className="h-4 w-4 text-indigo-500" />
            <span>Metadata Only Scan</span>
          </div>
          <div className="flex items-center justify-center space-x-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>30-Sec Safety Undo</span>
          </div>
          <div className="flex items-center justify-center space-x-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Smart Grouping</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            How InboxIQ Reclaims Your Mailbox
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
            Designed specifically for power users and clogged inboxes with 5,000 to 100,000+ messages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              1. Metadata Scanning & Grouping
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We analyze message headers (From, Subject, Date, Size, Category) to identify old promotions, social updates, OTP codes, and unread newsletters without touching your email content.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              2. Review Examples First
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Never worry about deleting an invoice or flight ticket. InboxIQ automatically excludes Starred and Important items, and lets you inspect real message previews before taking action.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Archive className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              3. Bulk Archive or Move to Trash
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Clean thousands of emails in one tap. Deletions move to Gmail Trash (retained for 30 days), and our built-in 30-second Undo toast lets you instantly reverse any action.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-500">
        <p>InboxIQ MVP v1.0 • Built with Google OAuth2 & Gmail API • 100% User Privacy Controlled</p>
      </footer>
    </div>
  );
};
