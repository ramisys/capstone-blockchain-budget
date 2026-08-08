/**
 * Shared formatting helpers for monetary values and dates.
 */

import { formatDistanceToNow } from 'date-fns';
import { CURRENCY } from '../constants/currency';

const currencyFormatter = new Intl.NumberFormat(CURRENCY.LOCALE, {
  style: 'currency',
  currency: CURRENCY.CODE,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat(CURRENCY.LOCALE, {
  style: 'currency',
  currency: CURRENCY.CODE,
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('en-US');

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  if (Number.isNaN(amount)) return currencyFormatter.format(0);
  return currencyFormatter.format(amount);
}

/**
 * Abbreviated currency for space-constrained contexts such as chart axes
 * (e.g. "₱2.4M"). Use `formatCurrency` wherever the exact amount matters.
 */
export function formatCompactCurrency(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  if (Number.isNaN(amount)) return compactCurrencyFormatter.format(0);
  return compactCurrencyFormatter.format(amount);
}

export function formatNumber(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  if (Number.isNaN(amount)) return '0';
  return numberFormatter.format(amount);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Human-readable elapsed time, e.g. "about 2 hours ago".
 *
 * Intended for feeds where recency matters more than the exact instant. Always
 * pair it with the absolute timestamp (a `title` attribute or `<time
 * dateTime>`) so the precise value stays available.
 */
export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
