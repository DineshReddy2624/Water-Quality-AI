import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun, Moon, Droplets, Bell, Shield, LogOut,
  User as UserIcon, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeAlertCount = 0 }) => {
  const { user, logout, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left brand & mobile toggle */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-teal-700 to-cyan-600 dark:from-white dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
              AquaSense AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
              v1.0 Pro
            </span>
          </div>
        </Link>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Active Alerts Pill */}
        <Link
          to="/alerts"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Active Alerts:</span>
          <span className="font-bold">{activeAlertCount}</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-600" />}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {user?.full_name || user?.email || 'Field Analyst'}
            </div>
            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium capitalize">
              {user?.role || 'standard'} account
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors border border-rose-200/50 dark:border-rose-900/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
