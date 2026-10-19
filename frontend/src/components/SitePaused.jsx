import React, { useState } from 'react';
import { 
  PauseCircle, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  ShieldAlert, 
  Mail, 
  ExternalLink,
  Clock,
  Layers,
  Database
} from 'lucide-react';

const SitePaused = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshMessage('');
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshMessage('Quota check completed. Limit remains exceeded. Contact administrator to resume.');
      setTimeout(() => setRefreshMessage(''), 5000);
    }, 1200);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Background ambient lighting glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-rose-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Top Navigation / Brand Header */}
      <header className="relative z-10 border-b border-gray-800/80 bg-[#0F172A]/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-lg">
              S
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">Shivansh Desktop</span>
              <span className="text-xs text-gray-400 block -mt-0.5">Enterprise Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Service Paused
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl mx-auto text-center">
          
          {/* Pause Emblem */}
          <div className="inline-flex items-center justify-center relative mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-b from-amber-500/20 to-orange-500/5 border border-amber-500/30 flex items-center justify-center shadow-2xl shadow-amber-500/10 backdrop-blur-sm">
              <PauseCircle className="w-12 h-12 text-amber-400 stroke-[1.75]" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-red-500/90 text-white p-1.5 rounded-xl border border-red-400/40 shadow-md">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          {/* Title & Primary Message */}
          <div className="space-y-3 mb-8">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              System Notice
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Site Paused
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-amber-300/95">
              &ldquo;Free limit exceeded&rdquo;
            </p>
            <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto leading-relaxed pt-1">
              This application has reached its allocated free usage tier limit. Realtime services, inventory access, and workflows are paused until the quota is renewed or upgraded.
            </p>
          </div>

          {/* Diagnostics Card */}
          <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 mb-8 backdrop-blur-md text-left shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Usage Limit Telemetry</span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                100% Quota Used
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Free Tier Allowance</span>
                <span className="font-mono text-amber-300 font-semibold">Exceeded</span>
              </div>
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full w-full" />
              </div>
            </div>

            {/* Metric Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-950/60 p-2.5 rounded-xl border border-gray-800/60">
                <div className="text-gray-400 flex items-center gap-1.5 mb-1">
                  <Server className="w-3.5 h-3.5 text-gray-400" />
                  <span>Deployment</span>
                </div>
                <div className="font-mono font-medium text-gray-200 truncate">shivansh-desktop</div>
              </div>

              <div className="bg-gray-950/60 p-2.5 rounded-xl border border-gray-800/60">
                <div className="text-gray-400 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Logged Date</span>
                </div>
                <div className="font-mono font-medium text-gray-200">{currentDate}</div>
              </div>

              <div className="bg-gray-950/60 p-2.5 rounded-xl border border-gray-800/60">
                <div className="text-gray-400 flex items-center gap-1.5 mb-1">
                  <Database className="w-3.5 h-3.5 text-gray-400" />
                  <span>Storage / Records</span>
                </div>
                <div className="font-mono font-medium text-amber-300">Cap Exceeded</div>
              </div>

              <div className="bg-gray-950/60 p-2.5 rounded-xl border border-gray-800/60">
                <div className="text-gray-400 flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  <span>State</span>
                </div>
                <div className="font-mono font-medium text-rose-400">Suspended</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking Quota...' : 'Refresh Status'}</span>
            </button>

            <a
              href="mailto:support@shivanshdesktop.com?subject=Inquiry:%20Free%20Limit%20Exceeded%20-%20Shivansh%20Desktop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-gray-200 hover:text-white font-medium text-sm border border-gray-700/60 transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4 text-gray-400" />
              <span>Contact Administrator</span>
            </a>
          </div>

          {/* Dynamic feedback message */}
          {refreshMessage && (
            <p className="mt-4 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-lg animate-fade-in">
              {refreshMessage}
            </p>
          )}

          {/* Help Notice */}
          <p className="mt-8 text-xs text-gray-500 max-w-sm mx-auto">
            If you are the administrator of this account, please upgrade your subscription or review your usage dashboard to restore full connectivity.
          </p>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900/80 bg-gray-950/40 px-6 py-4 text-center text-xs text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Shivansh Desktop. All rights reserved.</span>
          <span className="font-mono text-gray-400">Error Code: LIMIT_QUOTA_EXCEEDED</span>
        </div>
      </footer>
    </div>
  );
};

export default SitePaused;
