"use client";

interface SkeletonLoaderProps {
  rows?: number;
  columns?: number;
}

export default function SkeletonLoader({ rows = 5, columns = 4 }: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3 border-b border-gray-100">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md bg-[length:200%_100%] animate-shimmer" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

