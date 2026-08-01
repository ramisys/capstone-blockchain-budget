import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  loading?: boolean;
  subtitle?: string;
}

/**
 * Reusable dashboard statistics card with an icon, title, value, and an
 * optional skeleton loading state.
 */
const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconClassName = 'bg-indigo-50 text-indigo-600',
  loading = false,
  subtitle,
}) => {
  return (
    <Card className="p-5 h-full hover:shadow-md transition-shadow duration-200 border-slate-200/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-1.5">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-md" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};

export { StatisticsCard };
export default StatisticsCard;
