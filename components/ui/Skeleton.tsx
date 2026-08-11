import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-100">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-1/5" />
      <Skeleton className="h-4 w-12 ml-auto" />
    </div>
  );
};
