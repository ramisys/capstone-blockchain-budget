import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/Table';
import SortableHeader from '../ui/SortableHeader';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import Pagination from '../ui/Pagination';
import { AllocationStatusBadge } from './StatusBadge';
import EmptyState from './EmptyState';
import { Eye, Pencil, Archive, MoreVertical, FilesIcon } from 'lucide-react';
import { ROLES } from '../../constants/roles';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Allocation, PaginationInfo } from '../../types/allocation';
import type { AllocationStatus } from '../../types/allocation';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const canEditAllocation = (role: string, status: AllocationStatus): boolean => {
  if (role !== ROLES.ADMINISTRATOR && role !== ROLES.BUDGET_OFFICER) return false;
  return status === 'Draft';
};

const canArchiveAllocation = (role: string, status: AllocationStatus): boolean => {
  if (role === ROLES.ADMINISTRATOR) return status !== 'Archived';
  if (role === ROLES.BUDGET_OFFICER) return status === 'Draft';
  return false;
};

function TableSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 9 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-20 rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

interface AllocationTableProps {
  allocations: Allocation[];
  loading?: boolean;
  pagination?: PaginationInfo;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  role: string;
  onView: (allocation: Allocation) => void;
  onEdit: (allocation: Allocation) => void;
  onDelete: (allocation: Allocation) => void;
}

/**
 * Data table for allocations with sorting, pagination, role-aware actions, and
 * a responsive layout that scrolls horizontally on small screens.
 */
const AllocationTable: React.FC<AllocationTableProps> = ({
  allocations,
  loading = false,
  pagination,
  sortBy,
  sortOrder,
  onSort,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  role,
  onView,
  onEdit,
  onDelete,
}) => {
  const total = pagination?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="min-w-40">
                  <SortableHeader
                    label="Allocation Code"
                    sortKey="allocationCode"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                </TableHead>
                <TableHead className="min-w-28">Fiscal Year</TableHead>
                <TableHead className="min-w-44">
                  <SortableHeader
                    label="Department"
                    sortKey="department"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                </TableHead>
                <TableHead className="min-w-40">Fund Source</TableHead>
                <TableHead className="min-w-40">Budget Category</TableHead>
                <TableHead className="min-w-44">Program</TableHead>
                <TableHead className="min-w-36 text-right">
                  <SortableHeader
                    label="Allocated Amount"
                    sortKey="allocatedAmount"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                </TableHead>
                <TableHead className="min-w-28">Status</TableHead>
                <TableHead className="min-w-32">
                  <SortableHeader
                    label="Created Date"
                    sortKey="createdAt"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                </TableHead>
                <TableHead className="w-14 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows />
              ) : allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="px-4 py-12 text-center">
                    <EmptyState
                      icon={<FilesIcon className="w-10 h-10 text-slate-300" />}
                      title="No allocations found"
                      description="Try adjusting your search or filters to find what you're looking for."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map((allocation) => {
                  const editAllowed = canEditAllocation(role, allocation.status);
                  const archiveAllowed = canArchiveAllocation(role, allocation.status);

                  return (
                    <TableRow key={allocation.id} className="group">
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => onView(allocation)}
                          className="font-mono text-sm font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                        >
                          {allocation.allocationCode}
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {allocation.fiscalYear?.code ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {allocation.department?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {allocation.fundSource?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {allocation.category?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {allocation.program?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-800 tabular-nums">
                        {formatCurrency(allocation.allocatedAmount)}
                      </TableCell>
                      <TableCell>
                        <AllocationStatusBadge status={allocation.status} />
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(allocation.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                aria-label={`Actions for ${allocation.allocationCode}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onView(allocation)}>
                                <Eye className="mr-2 h-4 w-4 text-slate-400" />
                                View Details
                              </DropdownMenuItem>
                              {editAllowed && (
                                <DropdownMenuItem onClick={() => onEdit(allocation)}>
                                  <Pencil className="mr-2 h-4 w-4 text-slate-400" />
                                  Edit Allocation
                                </DropdownMenuItem>
                              )}
                              {archiveAllowed && (
                                <DropdownMenuItem
                                  onClick={() => onDelete(allocation)}
                                  className="text-red-600 focus:bg-red-50"
                                >
                                  <Archive className="mr-2 h-4 w-4 text-red-500" />
                                  {role === ROLES.ADMINISTRATOR ? 'Archive' : 'Delete'}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-20 px-3 py-1.5 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {pagination && (
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pageSize}
            onPageChange={onPageChange}
            label="allocations"
          />
        )}
      </div>
    </div>
  );
};

export { AllocationTable };
export default AllocationTable;
