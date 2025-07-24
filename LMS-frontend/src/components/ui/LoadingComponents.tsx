import React from 'react';

/**
 * Skeleton loader for a course card
 */
export const CourseCardSkeleton = () => {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="h-36 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      <div className="p-4 flex-grow">
        <div className="mb-1">
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="mt-2">
          <div className="h-5 w-3/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
          <div className="h-5 w-2/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

/**
 * Grid of course card skeletons
 */
export const CourseGridSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array(count).fill(0).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Skeleton for an assignment list item
 */
export const AssignmentItemSkeleton = () => {
  return (
    <div className="flex py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="mr-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      </div>
      <div className="flex-grow">
        <div className="h-7 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
        <div className="flex justify-between mt-2">
          <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * List of assignment skeletons
 */
export const AssignmentListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div>
      {Array(count).fill(0).map((_, index) => (
        <AssignmentItemSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Skeleton for a dashboard card
 */
export const DashboardCardSkeleton = ({ height = 350 }: { height?: number }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col" style={{ height: `${height}px` }}>
      <div className="flex items-center mb-4">
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-2"></div>
        <div className="h-8 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
      <div className="flex-grow">
        <div className="h-full w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

/**
 * Skeleton for profile information
 */
export const ProfileSkeleton = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-4 mb-2"></div>
      <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      
      <div className="w-full mt-8">
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

/**
 * Full-screen loading overlay with circular progress
 */
export const LoadingOverlay = ({ open }: { open: boolean }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
    </div>
  );
};

/**
 * Linear progress for page loading
 */
export const PageLoading = () => {
  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 bg-primary-main animate-pulse"></div>
    </div>
  );
};

/**
 * Generic content placeholder with customizable number of lines
 */
export const ContentPlaceholder = ({ lines = 3, animate = true }: { lines?: number, animate?: boolean }) => {
  return (
    <div className="w-full">
      {Array(lines).fill(0).map((_, index) => (
        <div 
          key={index}
          className={`h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 ${animate ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.random() * 50 + 50}%` }}
        ></div>
      ))}
    </div>
  );
};

/**
 * Table skeleton loader
 */
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) => {
  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex py-4 border-b-2 border-gray-200 dark:border-gray-700">
        {Array(cols).fill(0).map((_, index) => (
          <div key={index} className="flex-1 px-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {/* Data rows */}
      {Array(rows).fill(0).map((_, rowIndex) => (
        <div key={rowIndex} className="flex py-4 border-b border-gray-200 dark:border-gray-700">
          {Array(cols).fill(0).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 px-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Loading button state component
 */
export const LoadingButton = ({ loading, children }: { loading: boolean, children: React.ReactNode }) => {
  return (
    <div className="relative inline-flex items-center">
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}; 