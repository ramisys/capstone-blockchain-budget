import {
  LayoutDashboard,
  WalletCards,
  LayoutGrid,
  PieChart,
  CalendarDays,
  Banknote,
  Building2,
  FolderTree,
  ClipboardList,
  Wallet,
  BadgeCheck,
  Receipt,
  Users,
  UserCircle,
  Link2,
  FileText,
  FolderOpen,
  FolderPlus,
} from 'lucide-react';

export const navigationConfig = [
  {
    section: 'MAIN',
    items: [
      {
        type: 'link',
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    section: 'MANAGEMENT',
    items: [
      {
        type: 'group',
        label: 'Budget Allocation',
        icon: WalletCards,
        defaultExpanded: true,
        items: [
          {
            label: 'Overview',
            path: '/budget-allocation',
            icon: LayoutGrid,
            exact: true,
          },
          {
            label: 'Allocation Dashboard',
            path: '/budget-allocation/allocations/dashboard',
            icon: PieChart,
          },
          {
            label: 'Fiscal Years',
            path: '/budget-allocation/fiscal-years',
            legacyPaths: ['/fiscal-years'],
            icon: CalendarDays,
          },
          {
            label: 'Fund Sources',
            path: '/budget-allocation/fund-sources',
            legacyPaths: ['/fund-sources'],
            icon: Banknote,
          },
          {
            label: 'Departments',
            path: '/budget-allocation/departments',
            legacyPaths: ['/departments'],
            icon: Building2,
          },
          {
            label: 'Budget Categories',
            path: '/budget-allocation/budget-categories',
            legacyPaths: ['/budget-categories'],
            icon: FolderTree,
          },
          {
            label: 'Budget Programs',
            path: '/budget-allocation/budget-programs',
            legacyPaths: ['/budget-programs'],
            icon: ClipboardList,
          },
          {
            label: 'Budget Allocations',
            path: '/budget-allocation/allocations',
            legacyPaths: ['/budget-allocations'],
            icon: Wallet,
          },
          {
            label: 'Blockchain Ledger',
            path: '/budget-allocation/blockchain',
            icon: Link2,
          },
          {
            label: 'Approval Workflow',
            path: '/budget-allocation/approval-workflow',
            legacyPaths: ['/approval-workflow'],
            icon: BadgeCheck,
            status: 'Planned',
          },
        ],
      },
      {
        type: 'group',
        label: 'Expense Tracking',
        icon: Receipt,
        defaultExpanded: false,
        items: [
          {
            label: 'Expense Tracking',
            path: '/expense-tracking',
            icon: Receipt,
            status: 'Planned',
          },
        ],
      },
      {
        type: 'group',
        label: 'Documents',
        icon: FileText,
        defaultExpanded: false,
        items: [
          {
            label: 'Document List',
            path: '/documents',
            icon: FolderOpen,
          },
          {
            label: 'Upload Document',
            path: '/documents/upload',
            icon: FolderPlus,
          },
        ],
      },
    ],
  },
  {
    section: 'ADMINISTRATION',
    adminOnly: true,
    items: [
      {
        type: 'link',
        label: 'User Management',
        path: '/users',
        icon: Users,
      },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      {
        type: 'link',
        label: 'User Profile',
        path: '/profile',
        icon: UserCircle,
      },
    ],
  },
];
