import React from 'react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import EmptyState from '../allocations/EmptyState';
import { Archive, FileUp, History, Link2, Pencil, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import type { DocumentActivity, DocumentActivityAction } from '../../types/document';

const ACTION_META: Record<
  DocumentActivityAction,
  { label: string; icon: React.ReactNode; color: string; dot: string }
> = {
  UPLOAD: {
    label: 'Document uploaded',
    icon: <FileUp className="w-4 h-4" />,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  METADATA_UPDATE: {
    label: 'Metadata updated',
    icon: <Pencil className="w-4 h-4" />,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    dot: 'bg-indigo-500',
  },
  REPLACE: {
    label: 'Version replaced',
    icon: <FileUp className="w-4 h-4" />,
    color: 'bg-blue-50 text-blue-600 border-blue-200/80',
    dot: 'bg-blue-500',
  },
  ARCHIVE: {
    label: 'Document archived',
    icon: <Archive className="w-4 h-4" />,
    color: 'bg-amber-50 text-amber-600 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  VERIFY: {
    label: 'Verification run',
    icon: <ShieldCheck className="w-4 h-4" />,
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  ANCHOR_RETRY: {
    label: 'Anchor retried',
    icon: <Link2 className="w-4 h-4" />,
    color: 'bg-violet-50 text-violet-600 border-violet-200/80',
    dot: 'bg-violet-500',
  },
};

function summarize(details: Record<string, unknown> | null | undefined): string | null {
  if (!details) return null;
  try {
    return JSON.stringify(details);
  } catch {
    return null;
  }
}

interface ActivityTimelineProps {
  activities: DocumentActivity[];
  loading?: boolean;
  className?: string;
}

/**
 * Chronologically grouped activity feed for a document, newest first.
 */
const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  loading = false,
  className = '',
}) => {
  return (
    <Card className={`p-6 border-slate-200/80 ${className}`}>
      <div className="flex items-center gap-2 mb-5">
        <History className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">Activity Timeline</h3>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="space-y-2">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-64 rounded" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<History className="w-10 h-10 text-slate-300" />}
          title="No activity yet"
          description="Actions on this document will appear here."
        />
      ) : (
        <ol className="relative space-y-6 border-l border-slate-200 pl-6 ml-2">
          {activities.map((activity) => {
            const meta = ACTION_META[activity.action] ?? {
              label: activity.action,
              icon: <ShieldCheck className="w-4 h-4" />,
              color: 'bg-slate-100 text-slate-600 border-slate-200',
              dot: 'bg-slate-400',
            };
            const summary = summarize(activity.details);

            return (
              <li key={activity.id} className="relative">
                <span
                  className={`absolute -left-[35px] top-1 flex items-center justify-center w-8 h-8 rounded-full border ${meta.color}`}
                >
                  {meta.icon}
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  by <span className="font-medium text-slate-600">{activity.actor?.fullName ?? 'Unknown'}</span>
                  {activity.details?.versionNumber
                    ? ` · v${String(activity.details.versionNumber)}`
                    : ''}
                </p>
                {summary && (
                  <pre className="mt-2 text-[11px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap">
                    {summary}
                  </pre>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
};

export { ActivityTimeline };
export default ActivityTimeline;
