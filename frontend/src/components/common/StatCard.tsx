import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'teal' | 'cyan' | 'blue' | 'amber' | 'emerald' | 'rose' | 'purple';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'teal',
  trend,
}) => {
  const colorStyles = {
    teal: 'from-teal-500/10 to-teal-500/5 text-teal-600 dark:text-teal-400 border-teal-200/50 dark:border-teal-900/50',
    cyan: 'from-cyan-500/10 to-cyan-500/5 text-cyan-600 dark:text-cyan-400 border-cyan-200/50 dark:border-cyan-900/50',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/50',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50',
    rose: 'from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/50',
    purple: 'from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/50',
  };

  const iconBgStyles = {
    teal: 'bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400',
    blue: 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400',
    purple: 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border p-5 shadow-sm bg-gradient-to-br bg-white dark:bg-slate-900 ${colorStyles[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${iconBgStyles[color]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
        {trend && (
          <span className={`text-[11px] font-semibold ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </div>
      )}
    </div>
  );
};
