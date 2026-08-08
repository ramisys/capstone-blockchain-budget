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
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentTypeBadge } from './DocumentTypeBadge';
import { BlockchainStatusBadge } from '../blockchain/BlockchainStatusBadge';
import EmptyState from '../allocations/EmptyState';
import { Download, Eye, MoreVertical, Archive, Files } from 'lucide-react';
import { ROLES } from '../../constants/roles';
import { DOCUMENT_STATUS } from '../../constants/documentStatus';
import { formatDate } from '../../utils/format';
import type { ManagedDocument, PaginationInfo } from '../../types/document';
import type { BlockchainRecordStatus } from '../../types/blockchain';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const canArchiveDocument = (role: string, document: ManagedDocument, currentUserId?: string): boolean => {
  if (document.status === DOCUMENT_STATUS.ARCHIVED) return false;
  if (role === ROLES.ADMINISTRATOR) return true;
  return document.uploadedBy === currentUserId;
};

function TableSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 8 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-20 rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

interface DocumentTableProps {
  documents: ManagedDocument[];
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
  currentUserId?: string;
  onView: (document: ManagedDocument) => void;
  onDownload: (document: ManagedDocument) => void;
  onArchive: (document: ManagedDocument) => void;
}

/**
 * Data table for documents with sorting, pagination, role-aware actions, and a
 * responsive layout that scrolls horizontally on small screens.
 */
const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
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
  currentUserId,
  onView,
  onDownload,
  onArchive,
}) => {
  const total = pagination?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="min-w-36">
                  <SortableHeader
                    label="Document Code"
                    sortKey="documentCode"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                </TableHead>
                <TableHead className="min-w-44">
                  <SortableHeader
                    label="Title"
                    sortKey="title"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSort}
                  />
                </TableHead>
                <TableHead className="min-w-36">Type</TableHead>
                <TableHead className="min-w-28">Fiscal Year</TableHead>
                <TableHead className="min-w-40">Department</TableHead>
                <TableHead className="min-w-32">Ledger Status</TableHead>
                <TableHead className="min-w-24">Status</TableHead>
                <TableHead className="min-w-32">
                  <SortableHeader
                    label="Uploaded Date"
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
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-4 py-12 text-center">
                    <EmptyState
                      icon={<Files className="w-10 h-10 text-slate-300" />}
                      title="No documents found"
                      description="Try adjusting your search or filters to find what you're looking for."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((document) => {
                  const archiveAllowed = canArchiveDocument(role, document, currentUserId);
                  const ledgerStatus = document.currentVersion?.blockchainStatus as
                    | BlockchainRecordStatus
                    | undefined;

                  return (
                    <TableRow key={document.id} className="group">
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => onView(document)}
                          className="font-mono text-sm font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                        >
                          {document.documentCode}
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <span className="block font-medium text-slate-800">
                          {document.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DocumentTypeBadge type={document.documentType} />
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {document.fiscalYear?.code ?? '—'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {document.department?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        {ledgerStatus ? (
                          <BlockchainStatusBadge status={ledgerStatus} />
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DocumentStatusBadge status={document.status} />
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {formatDate(document.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                aria-label={`Actions for ${document.documentCode}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onView(document)}>
                                <Eye className="mr-2 h-4 w-4 text-slate-400" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDownload(document)}>
                                <Download className="mr-2 h-4 w-4 text-slate-400" />
                                Download
                              </DropdownMenuItem>
                              {archiveAllowed && (
                                <DropdownMenuItem
                                  onClick={() => onArchive(document)}
                                  className="text-red-600 focus:bg-red-50"
                                >
                                  <Archive className="mr-2 h-4 w-4 text-red-500" />
                                  Archive
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
            label="documents"
          />
        )}
      </div>
    </div>
  );
};

export { DocumentTable };
export default DocumentTable;
