import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { alertService } from '../../services';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);

  useEffect(() => {
    const fetchActiveAlerts = async () => {
      try {
        const alerts = await alertService.list({ status: 'Active' });
        setActiveAlertCount(alerts.length);
      } catch (e) {
        // Fallback or ignore on unauth
      }
    };
    fetchActiveAlerts();
    const interval = setInterval(fetchActiveAlerts, 30000); // 30s polling for background alerts
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar activeAlertCount={activeAlertCount} />

      {/* Educational Screening & Decision-Support Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-cyan-950 text-white text-[11px] px-4 py-1.5 flex items-center justify-between border-b border-teal-800/40">
        <div className="flex items-center gap-2 max-w-5xl mx-auto text-center sm:text-left">
          <ShieldAlert className="h-3.5 w-3.5 text-teal-400 shrink-0" />
          <span>
            <b>DECISION-SUPPORT SCREENING SYSTEM:</b> This application provides analytical screening and parameter deviation scoring. It does not certify drinking-water safety or identify chemical contaminants without verified laboratory testing.
          </span>
        </div>
      </div>

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
