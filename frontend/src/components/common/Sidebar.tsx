import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Activity, PlusCircle, UploadCloud,
  FileSpreadsheet, Sparkles, AlertOctagon, ShieldAlert,
  BrainCircuit, MapPin, Compass, History, BarChart3,
  BellRing, FileText, Users, Sliders
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Main Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Water Quality KPIs', path: '/quality-dashboard', icon: Activity },
      ]
    },
    {
      title: 'Data Collection',
      items: [
        { name: 'Manual Sample Entry', path: '/samples/new', icon: PlusCircle },
        { name: 'Dataset Upload', path: '/datasets/upload', icon: UploadCloud },
        { name: 'Sample Records', path: '/samples', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'Analysis & Machine Learning',
      items: [
        { name: 'Parameter Screening', path: '/analysis', icon: Sparkles },
        { name: 'Quality Classification', path: '/classification', icon: Activity },
        { name: 'Contamination Detection', path: '/contamination', icon: AlertOctagon },
        { name: 'Anomaly Detection', path: '/anomalies', icon: ShieldAlert },
        { name: 'ML Pipeline & Models', path: '/ml', icon: BrainCircuit },
      ]
    },
    {
      title: 'Spatial & Trends',
      items: [
        { name: 'Water Quality Map', path: '/map', icon: MapPin },
        { name: 'Monitoring Locations', path: '/locations', icon: Compass },
        { name: 'Historical Analysis', path: '/history', icon: History },
        { name: 'Analytics & Visuals', path: '/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Alerts & Reports',
      items: [
        { name: 'Alert Management', path: '/alerts', icon: BellRing },
        { name: 'Reports & Exports', path: '/reports', icon: FileText },
      ]
    },
    ...(isAdmin ? [{
      title: 'Administration',
      items: [
        { name: 'User Management', path: '/users', icon: Users },
        { name: 'Thresholds & Settings', path: '/settings', icon: Sliders },
      ]
    }] : [{
      title: 'System Settings',
      items: [
        { name: 'Thresholds & Settings', path: '/settings', icon: Sliders },
      ]
    }])
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-3 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-500/15 to-cyan-500/15 text-teal-700 dark:text-teal-300 font-semibold border-l-2 border-teal-500'
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
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
        AquaSense Decision Support Platform
      </div>
    </aside>
  );
};
