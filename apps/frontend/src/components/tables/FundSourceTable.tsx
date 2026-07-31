import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from '../ui/Table';
import { ChevronsUpDown, Calendar, Check, X, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DropdownMenu } from '../ui/DropdownMenu';
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';
import Pagination from '../ui/Pagination';
import SortableHeader from '../ui/SortableHeader';

interface FundSource {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

interface FundSourceTableProps {
  fundSources: FundSource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onEdit: (fundSource: FundSource) => void;
  onDetails: (fundSource: FundSource) => void;
  onDelete: (fundSource: FundSource) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
  onDeleteFundSource: (id: string) => void;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (sortKey: string) => void;
}

const StatusBadge: React.FC<{ status: 'Active' | 'Inactive' }> = ({ status }) => {
  const statusConfig: Record<'Active' | 'Inactive', { variant: string; label: string }> = {
    Active: { variant: 'default', label: 'Active' },
    Inactive: { variant: 'secondary', label: 'Inactive' }
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const FundSourceTable: React.FC<FundSourceTableProps> = ({
  fundSources,
  pagination,
  onEdit,
  onDetails,
  onDelete,
  isLoading = false,
  isDeleting = false,
  onDeleteFundSource,
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
        Fund Sources ({pagination.total} total)
      </TableCaption>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                <SortableHeader label="Fund Source Code" sortKey="code" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                <SortableHeader label="Fund Source Name" sortKey="name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Description
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                <SortableHeader label="Status" sortKey="status" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-slate-100">
            {fundSources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-6 py-4 text-center text-slate-500">
                  No fund sources found
                </TableCell>
              </TableRow>
            ) : (
              fundSources.map((fundSource) => (
                <TableRow
                  key={fundSource.id}
                  className="hover:bg-slate-50"
                >
                  <TableCell className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {fundSource.code}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    {fundSource.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    {fundSource.description || '---'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <StatusBadge status={fundSource.status} />
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-9 w-24">
                        <Button variant="outline" size="icon" className="h-8 w-8 p-0">
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem
                          onClick={() => onDetails(fundSource)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <span>View Details</span>
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onEdit(fundSource)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <span>Edit</span>
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          </svg>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onDelete(fundSource)}
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

      {fundSources.length > 0 && (
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

export { FundSourceTable };
export default FundSourceTable;