import React from 'react';
import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (sortKey: string) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  sortBy,
  sortOrder,
  onSort,
  className = '',
}) => {
  const isActive = sortBy === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-700 ${className}`}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {isActive ? (
        sortOrder === 'asc' ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )
      ) : (
        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />
      )}
    </button>
  );
};

export default SortableHeader;
