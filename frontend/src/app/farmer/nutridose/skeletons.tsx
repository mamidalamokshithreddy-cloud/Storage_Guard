interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}

export function AnalysisCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border bg-card relative overflow-hidden">
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-6 bg-muted rounded-full w-12" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
          <div className="h-2 bg-muted rounded w-full" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function VendorCardSkeleton() {
  return (
    <div className="p-4 border border-border rounded-lg animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-40" />
          <div className="flex items-center gap-2">
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>
          <div className="h-4 bg-muted rounded w-32" />
        </div>
        <div className="text-right">
          <div className="h-5 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-16 mt-1" />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="h-6 bg-muted rounded" />
        <div className="h-6 bg-muted rounded" />
        <div className="h-6 bg-muted rounded" />
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="space-y-1">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="h-8 bg-muted rounded flex-1" />
        <div className="h-8 bg-muted rounded w-8" />
        <div className="h-8 bg-muted rounded w-8" />
      </div>
    </div>
  );
}

export function WeatherCardSkeleton() {
  return (
    <div className="mb-6 p-4 bg-gradient-field rounded-lg border border-primary/20 animate-pulse">
      <div className="h-6 bg-muted rounded w-40 mb-3" />
      <div className="grid grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-6 w-6 bg-muted rounded mx-auto mb-1" />
            <div className="h-4 bg-muted rounded w-12 mx-auto" />
            <div className="h-3 bg-muted rounded w-16 mx-auto mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScheduleCardSkeleton() {
  return (
    <div className="space-y-3">
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 bg-muted rounded-full" />
              <div>
                <div className="h-5 bg-muted rounded w-32" />
                <div className="h-4 bg-muted rounded w-24 mt-1" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-16 mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-muted rounded w-24 mb-1" />
              <div className="h-4 bg-muted rounded w-16" />
            </div>
            <div>
              <div className="h-4 bg-muted rounded w-24 mb-1" />
              <div className="h-4 bg-muted rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}