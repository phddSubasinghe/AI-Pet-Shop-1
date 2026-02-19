import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AdminSkeletonStatCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6"
        >
          <Skeleton className="h-4 w-24 mb-4 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function AdminSkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden">
      <div className="p-4 border-b border-border/80 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 rounded-lg" />
        ))}
      </div>
      <div className="divide-y divide-border/80">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, col) => (
              <Skeleton key={col} className="h-4 flex-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6",
            "flex flex-col sm:flex-row sm:items-center gap-4"
          )}
        >
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function AdminSkeletonActivityFeed({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-[200px] rounded-lg" />
            <Skeleton className="h-3 w-full max-w-[280px] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
