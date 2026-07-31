import { useEffect, useState } from 'react';

interface ListControlsOptions {
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
  pageSize?: number;
}

export interface ListControls {
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (pageSize: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (sortKey: string) => void;
}

export function useListControls(options: ListControlsOptions = {}): ListControls {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(options.pageSize ?? 10);
  const [sortBy, setSortBy] = useState(options.initialSortBy ?? 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.initialSortOrder ?? 'desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize, sortBy, sortOrder]);

  const handleSort = (sortKey: string) => {
    if (sortBy === sortKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(sortKey);
      setSortOrder('asc');
    }
  };

  return {
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    sortOrder,
    handleSort,
  };
}
