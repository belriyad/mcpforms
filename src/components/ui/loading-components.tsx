import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message,
  className 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className={cn(
          "rounded-full border-4 border-gray-200",
          sizeClasses[size]
        )} />
        {/* Spinning gradient */}
        <div className={cn(
          "absolute inset-0 rounded-full border-4 border-transparent",
          "border-t-blue-500 border-r-purple-500",
          "animate-spin",
          sizeClasses[size]
        )} />
      </div>
      {message && (
        <p className="text-sm text-gray-600 animate-pulse font-medium">{message}</p>
      )}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => (
  <div className={cn("bg-white rounded-2xl border border-gray-200 p-6 animate-pulse", className)}>
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-4/6" />
    </div>
  </div>
);

interface ProgressIndicatorProps {
  progress: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  progress, 
  total, 
  label,
  showPercentage = true,
  className 
}) => {
  const percentage = Math.round((progress / total) * 100);
  
  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-blue-600">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className }) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className="h-4 bg-gray-200 rounded animate-pulse"
        style={{ width: `${100 - (i * 10)}%` }}
      />
    ))}
  </div>
);

interface PulseDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PulseDots: React.FC<PulseDotsProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-blue-600 animate-pulse",
            sizeClasses[size]
          )}
          style={{
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  );
};
