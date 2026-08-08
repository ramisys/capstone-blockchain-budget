import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BellOff,
  CheckCircle2,
  ChevronRight,
  Info,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NOTIFICATION_TARGETS } from '../../constants/notifications';
import type {
  DashboardNotification,
  DashboardNotificationType,
} from '../../types/dashboard';

/**
 * Severity is carried by a distinct icon as well as colour, so the three levels
 * stay distinguishable in greyscale and to anyone who cannot rely on hue.
 */
const SEVERITY: Record<
  DashboardNotificationType,
  { icon: LucideIcon; className: string; label: string }
> = {
  error: {
    icon: XCircle,
    className: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    label: 'Warning',
  },
  info: {
    icon: Info,
    className: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    label: 'Information',
  },
  success: {
    icon: CheckCircle2,
    className: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    label: 'Success',
  },
};

const FALLBACK_SEVERITY = SEVERITY.info;

interface NotificationPanelProps {
  notifications: DashboardNotification[];
}

/**
 * Live-state notifications. Each item either links somewhere the signed-in user
 * is allowed to go, or renders as plain informational text — never as a link
 * that goes nowhere.
 */
export function NotificationPanel({ notifications }: NotificationPanelProps) {
  const { hasRole } = useAuth();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BellOff className="w-8 h-8 text-slate-300 mb-2" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-900">Nothing to report</p>
        <p className="text-xs text-slate-500 mt-1">
          No inactive accounts, pending approvals, or failed ledger anchors.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {notifications.map((notification, index) => {
        const severity = SEVERITY[notification.type] ?? FALLBACK_SEVERITY;
        const Icon = severity.icon;
        const target = notification.key
          ? NOTIFICATION_TARGETS[notification.key]
          : undefined;
        const canFollow =
          target && (target.roles.length === 0 || hasRole(...target.roles));

        const body = (
          <>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${severity.className}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{severity.label}:</span>
            </span>
            <span className="min-w-0 grow">
              <span className="block font-medium text-slate-900">
                {notification.title}
              </span>
              <span className="block text-sm text-slate-500 line-clamp-2">
                {notification.message}
              </span>
            </span>
          </>
        );

        return (
          <li key={notification.key ?? `${notification.title}-${index}`}>
            {canFollow ? (
              <Link
                to={target!.to}
                aria-label={`${notification.title}: ${notification.message} ${target!.actionLabel}`}
                className="flex items-start gap-3 rounded-xl p-2 -m-2 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30"
              >
                {body}
                <ChevronRight
                  className="w-4 h-4 shrink-0 text-slate-500 mt-1"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <div className="flex items-start gap-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default NotificationPanel;
