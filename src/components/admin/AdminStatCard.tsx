import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  description?: string;
}

export function AdminStatCard({ title, value, icon: Icon, className, description }: AdminStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl p-6",
        "shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        className
      )}
      role="article"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      </div>
    </div>
  );
}
