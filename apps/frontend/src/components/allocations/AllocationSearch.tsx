import React from 'react';
import SearchInput from '../ui/SearchInput';

interface AllocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Search input tailored to the allocation list. The backend performs a fuzzy
 * search across allocation code, department, fund source, category, and program.
 */
const AllocationSearch: React.FC<AllocationSearchProps> = ({ value, onChange, className = '' }) => {
  return (
    <SearchInput
      value={value}
      onChange={onChange}
      placeholder="Search by allocation code, department, fund source, category, or program..."
      className={className}
    />
  );
};

export { AllocationSearch };
export default AllocationSearch;
