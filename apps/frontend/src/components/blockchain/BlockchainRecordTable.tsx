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
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';
import Pagination from '../ui/Pagination';
import { BlockchainStatusBadge } from './BlockchainStatusBadge';
import { BLOCKCHAIN_RECORD_STATUS } from '../../constants/blockchainStatus';
import { formatDateTime } from '../../utils/format';
import { Link2, MoreVertical, RefreshCw, ShieldCheck } from 'lucide-react';
import type { BlockchainRecord } from '../../types/blockchain';
import type { PaginationInfo } from '../../types/allocation';

const shortHash = (value: string | null, length = 10): string => {
  if (!value) return '—';
  if (value.length <= length * 2 + 2) return value;
  return `${value.slice(0, length)}...${value.slice(-length)}`;
};

interface BlockchainRecordTableProps {
  records: BlockchainRecord[];
  pagination: PaginationInfo;
  canRetry: boolean;
  isRetrying: boolean;
  onVerify: (record: BlockchainRecord) => void;
  onRetry: (record: BlockchainRecord) => void;
  onPageChange: (page: number) => void;
}

const BlockchainRecordTable: React.FC<BlockchainRecordTableProps> = ({
  records,
  pagination,
  canRetry,
  isRetrying,
  onVerify,
  onRetry,
  onPageChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableCaption className="text-slate-600 font-medium mb-2">
            Blockchain Transactions ({pagination.total} total)
          </TableCaption>
          <TableHeader className="bg-slate-50">
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="px-6 py-3 min-w-36">Allocation Code</TableHead>
              <TableHead className="px-6 py-3 min-w-24">Status</TableHead>
              <TableHead className="px-6 py-3 min-w-20">Block</TableHead>
              <TableHead className="px-6 py-3 min-w-40">Transaction Hash</TableHead>
              <TableHead className="px-6 py-3 min-w-40">Confirmed At</TableHead>
              <TableHead className="px-6 py-3 min-w-24">Network</TableHead>
              <TableHead className="px-6 py-3 min-w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-slate-100">
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  No blockchain records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const needsRetry =
                  record.status === BLOCKCHAIN_RECORD_STATUS.PENDING ||
                  record.status === BLOCKCHAIN_RECORD_STATUS.FAILED;
                return (
                  <TableRow key={record.id} className="hover:bg-slate-50">
                    <TableCell className="px-6 py-4 text-sm font-medium text-indigo-700 whitespace-nowrap">
                      <span className="font-mono">{record.allocationCode}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">
                      <BlockchainStatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600 tabular-nums">
                      {record.blockNumber ?? '—'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-600">
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                        {shortHash(record.txHash)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {record.confirmedAt ? formatDateTime(record.confirmedAt) : '—'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-600">
                      {record.network || '—'}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" type="button" onClick={() => onVerify(record)}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verify
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-44">
                            {needsRetry && canRetry && (
                              <DropdownMenuItem
                                onClick={() => onRetry(record)}
                                disabled={isRetrying}
                                className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                              >
                                <span>Retry Anchor</span>
                                <RefreshCw className="w-4 h-4 text-slate-400" />
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => onVerify(record)}
                              className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <span>View Verification</span>
                              <ShieldCheck className="w-4 h-4 text-slate-400" />
                            </DropdownMenuItem>
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

      {records.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.limit}
          onPageChange={onPageChange}
          label="transactions"
        />
      )}
    </div>
  );
};

export { BlockchainRecordTable };
export default BlockchainRecordTable;
