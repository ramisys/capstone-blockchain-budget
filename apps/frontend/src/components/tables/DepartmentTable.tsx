import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from '../ui/Table';
import { ChevronsUpDown, Calendar, Check, X, AlertTriangle, User, Phone, Mail, Building2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DropdownMenu } from '../ui/DropdownMenu';
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/DropdownMenu';

interface Department {
  id: string;
  code: string;
  name: string;
  officeHead?: string;
  contactNumber?: string;
  email?: string;
  officeAddress?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

interface DepartmentTableProps {
  departments: Department[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onEdit: (department: Department) => void;
  onDetails: (department: Department) => void;
  onDelete: (department: Department) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
  onDeleteDepartment: (id: string) => void;
}

const StatusBadge: React.FC<{ status: 'Active' | 'Inactive' }> = ({ status }) => {
  const statusConfig: Record<'Active' | 'Inactive', { variant: string; label: string }> = {
    Active: { variant: 'default', label: 'Active' },
    Inactive: { variant: 'secondary', label: 'Inactive' }
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const DepartmentTable: React.FC<DepartmentTableProps> = ({
  departments,
  pagination,
  onEdit,
  onDetails,
  onDelete,
  isLoading = false,
  isDeleting = false,
  onDeleteDepartment
}) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table className="w-full">
        <TableCaption className="text-slate-600 font-medium mb-2">
        Departments ({pagination.total} total)
      </TableCaption>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Department Code
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Department Name
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Office Head
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Contact Number
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Email
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Status
              </TableCell>
              <TableCell className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="bg-white divide-y divide-slate-100">
            {departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-4 text-center text-slate-500">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow
                  key={department.id}
                  className="hover:bg-slate-50"
                >
                  <TableCell className="px-6 py-4 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {department.code}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    {department.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    {department.officeHead || '---'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    {department.contactNumber || '---'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-slate-600">
                    {department.email || '---'}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <StatusBadge status={department.status} />
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
                          onClick={() => onDetails(department)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <span>View Details</span>
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onEdit(department)}
                          className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <span>Edit</span>
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          </svg>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => onDelete(department)}
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

      {departments.length > 0 && (
        <div className="flex justify-between items-center text-sm text-slate-500">
          <span className="flex items-center">
            Showing {departments.length} of {pagination.total} departments
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // TODO: Implement previous page logic
              }}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-slate-500 hover:text-slate-700 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
            >
              ‹
            </button>
            <span>{pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => {
                // TODO: Implement next page logic
              }}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-slate-500 hover:text-slate-700 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { DepartmentTable };
export default DepartmentTable;