import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/**
 * Grid of skeleton cards shown while dashboard statistics load.
 */
export function AllocationStatsSkeleton({ count = 7, columns = 4 }) {
  const gridClass =
    count > 4
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
      : `grid grid-cols-1 sm:grid-cols-2 gap-4`;

  return (
    <div className={gridClass} aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton mimicking a data table (header + rows) used while the allocation
 * list loads.
 */
export function AllocationTableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Skeleton className="h-4 w-40 rounded" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4 flex items-center gap-4">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-16 rounded hidden md:block" />
            <Skeleton className="h-4 w-32 rounded hidden lg:block" />
            <Skeleton className="h-4 w-20 rounded hidden lg:block" />
            <Skeleton className="h-6 w-24 rounded-full ml-auto shrink-0" />
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
