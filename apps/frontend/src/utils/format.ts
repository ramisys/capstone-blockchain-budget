/**
 * Shared formatting helpers for monetary values and dates.
 */

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
