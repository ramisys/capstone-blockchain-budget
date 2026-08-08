import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { formatCompactCurrency, formatCurrency } from '../../utils/format';
import type { AllocationBreakdownEntry } from '../../types/allocation';

/** Rows shown before the tail is folded into a single "Other" row. */
const TOP_N = 8;

/**
 * Recharts writes `fill` as an SVG presentation attribute, which does not
 * resolve CSS custom properties, so the design tokens are mirrored here as
 * literals: --color-primary for the ranked bars and --color-text-muted for the
 * aggregated tail, which is not a real category.
 */
const BAR_COLOR = '#1B3A5C';
const OTHER_COLOR = '#8B93A0';

interface ChartRow {
  name: string;
  amount: number;
  allocationCount: number;
  isOther: boolean;
}

/**
 * Fold the ranked entries into at most TOP_N rows plus an aggregated tail, so
 * a long department list stays legible instead of collapsing into hairlines.
 */
function toChartRows(entries: AllocationBreakdownEntry[]): ChartRow[] {
  const rows: ChartRow[] = entries.slice(0, TOP_N).map((entry) => ({
    name: entry.name,
    amount: entry.amount,
    allocationCount: entry.allocationCount,
    isOther: false,
  }));

  const tail = entries.slice(TOP_N);
  if (tail.length > 0) {
    rows.push({
      name: `Other (${tail.length})`,
      amount: tail.reduce((sum, entry) => sum + entry.amount, 0),
      allocationCount: tail.reduce((sum, entry) => sum + entry.allocationCount, 0),
      isOther: true,
    });
  }

  return rows;
}

interface AllocationBreakdownChartProps {
  title: string;
  description?: string;
  entries?: AllocationBreakdownEntry[];
  loading?: boolean;
  emptyMessage?: string;
}

/**
 * Ranked horizontal bar chart of approved allocation amounts.
 *
 * Single series, so there is no legend: the category names on the axis already
 * label every bar. The chart is exposed to assistive tech as an image with a
 * summarizing label, backed by a visually hidden table carrying the exact
 * figures.
 */
export function AllocationBreakdownChart({
  title,
  description,
  entries,
  loading = false,
  emptyMessage = 'No approved allocations to break down yet.',
}: AllocationBreakdownChartProps) {
  const rows = useMemo(() => toChartRows(entries ?? []), [entries]);

  const chartHeight = Math.max(180, rows.length * 38 + 32);

  const ariaSummary =
    rows.length > 0
      ? `${title}: ${rows
          .map((row) => `${row.name} ${formatCurrency(row.amount)}`)
          .join(', ')}`
      : `${title}: no data`;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </CardHeader>
      <CardBody className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((row) => (
              <Skeleton key={row} className="h-6 w-full rounded" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-slate-500 py-8">{emptyMessage}</p>
        ) : (
          <>
            <div role="img" aria-label={ariaSummary}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={rows}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatCompactCurrency(value as number)}
                    tick={{ fontSize: 11, fill: '#5E6674' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: '#5E6674' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(27, 58, 92, 0.06)' }}
                    formatter={(value: number, _name, item: any) => [
                      `${formatCurrency(value)} · ${item?.payload?.allocationCount ?? 0} allocation${
                        item?.payload?.allocationCount === 1 ? '' : 's'
                      }`,
                      'Allocated',
                    ]}
                  />
                  <Bar dataKey="amount" barSize={18} radius={[0, 4, 4, 0]}>
                    {rows.map((row) => (
                      <Cell
                        key={row.name}
                        fill={row.isOther ? OTHER_COLOR : BAR_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Exact figures for screen readers and anyone who cannot read the bars. */}
            <table className="sr-only">
              <caption>{title}</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Allocated amount</th>
                  <th scope="col">Allocations</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name}>
                    <th scope="row">{row.name}</th>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>{row.allocationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardBody>
    </Card>
  );
}

export default AllocationBreakdownChart;
