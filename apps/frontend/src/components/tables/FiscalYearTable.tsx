import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '../ui/Table';
import { ChevronsUpDown, Calendar, Check, X, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DropdownMenu } from '../ui/DropdownMenu';
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';
import Pagination from '../ui/Pagination';
import SortableHeader from '../ui/SortableHeader';

interface FiscalYear {
  id: string;
  code: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive' | 'Archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FiscalYearTableProps {
  fiscalYears: FiscalYear[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onEdit: (fiscalYear: FiscalYear) => void;
  onDetails: (fiscalYear: FiscalYear) => void;
  onDelete: (fiscalYear: FiscalYear) => void;
  onActivate: (fiscalYear: FiscalYear) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
  isActivating?: boolean;
  onDeleteFiscalYear: (id: string) => void;
  onSetActiveFiscalYear: (id: string) => void;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (sortKey: string) => void;
}

const FiscalYearTable: React.FC<FiscalYearTableProps> = ({
  fiscalYears,
  pagination,
  onEdit,
  onDetails,
  onDelete,
  onActivate,
  isLoading = false,
  isDeleting = false,
  isActivating = false,
  onDeleteFiscalYear,
  onSetActiveFiscalYear,
  onPageChange,
  sortBy,
  sortOrder,
  onSort
}) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table className="w-full">
        <TableCaption className="text-slate-600 font-medium mb-2">
        Fiscal Years ({pagination.total} total)
      </TableCaption>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                <SortableHeader label="Fiscal Year Code" sortKey="code" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                <SortableHeader label="Description" sortKey="description" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                <SortableHeader label="Start Date" sortKey="startDate" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                <SortableHeader label="End Date" sortKey="endDate" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                <SortableHeader label="Status" sortKey="status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-slate-100">
            {fiscalYears.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-4 text-center text-slate-500">
                  No fiscal years found
                </TableCell>
              </TableRow>
            ) : (
              fiscalYears.map((fiscalYear) => (
                <TableRow
                  key={fiscalYear.id}
                  className="hover:bg-slate-50"
                >
                  <TableCell className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {fiscalYear.code}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    {fiscalYear.description}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {new Date(fiscalYear.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {new Date(fiscalYear.endDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <StatusBadge status={fiscalYear.status} />
                    {fiscalYear.isActive && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ACTIVE
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem
                          onClick={() => onDetails(fiscalYear)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <span>View Details</span>
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onEdit(fiscalYear)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <span>Edit</span>
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          </svg>
                        </DropdownMenuItem>

                        {!fiscalYear.isActive && fiscalYear.status !== 'Archived' && (
                          <DropdownMenuItem
                            onClick={() => onActivate(fiscalYear)}
                            className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <span>Set as Active</span>
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9 6 9-6" />
                            </svg>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => onDelete(fiscalYear)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <span>Delete</span>
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10H4a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-2a1 1 0 00-1-1H4a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1h-2a1 1 0 00-1-1" />
                          </svg>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {fiscalYears.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export { FiscalYearTable };
export default FiscalYearTable;