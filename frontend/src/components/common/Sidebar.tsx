import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, UploadCloud,
  FileSpreadsheet, Sparkles, ShieldAlert,
  BrainCircuit, MapPin, BellRing, FileText,
  Sliders, Users
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  // Core required primary navigation items
  const primaryNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Water Samples', path: '/samples', icon: FileSpreadsheet },
    { name: 'Manual Entry', path: '/samples/new', icon: PlusCircle },
    { name: 'Dataset Upload', path: '/datasets/upload', icon: UploadCloud },
    { name: 'Quality Analysis', path: '/classification', icon: Sparkles },
    { name: 'Anomaly Detection', path: '/anomalies', icon: ShieldAlert },
    { name: 'ML Pipeline', path: '/ml', icon: BrainCircuit },
    { name: 'Water Quality Map', path: '/map', icon: MapPin },
    { name: 'Alerts', path: '/alerts', icon: BellRing },
    { name: 'Reports', path: '/reports', icon: FileText },
  ];

  const adminNavItems = [
    ...(isAdmin ? [{ name: 'User Management', path: '/users', icon: Users }] : []),
    { name: 'Settings', path: '/settings', icon: Sliders },
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-3 space-y-4">
        {/* Main Navigation */}
        <div className="space-y-0.5">
          <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Menu
          </div>
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold border-l-2 border-teal-500 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* System & Configuration */}
        <div className="space-y-0.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            System
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold border-l-2 border-teal-500 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-3 text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800">
        AquaSense AI &bull; Screening System
      </div>
    </aside>
  );
};
