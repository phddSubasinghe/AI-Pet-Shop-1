import { Skeleton } from "@/components/ui/skeleton";

export function MatchResultsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="glass-card rounded-3xl overflow-hidden border border-white/10 dark:border-white/5">
        <div className="grid sm:grid-cols-2 gap-0">
          <Skeleton className="aspect-[4/3] sm:min-h-[280px] rounded-none" />
          <div className="p-8 sm:p-10 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-28 rounded-full" />
              <Skeleton className="h-11 w-40 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="rounded-2xl aspect-[4/5]" />
          ))}
        </div>
      </div>
    </div>
  );
}
