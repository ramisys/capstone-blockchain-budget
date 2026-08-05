import React from 'react';
import SearchInput from '../ui/SearchInput';

interface DocumentSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Search input tailored to the document list. The backend performs a fuzzy
 * search across code, title, file name, description, and linked allocation.
 */
const DocumentSearch: React.FC<DocumentSearchProps> = ({ value, onChange, className = '' }) => {
  return (
    <SearchInput
      value={value}
      onChange={onChange}
      placeholder="Search by code, title, file name, or allocation code..."
      className={className}
    />
  );
};

export { DocumentSearch };
export default DocumentSearch;
