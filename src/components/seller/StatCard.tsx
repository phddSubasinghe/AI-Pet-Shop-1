import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  /** Optional trend or subtitle */
  subtitle?: string;
}

export function StatCard({ label, value, icon: Icon, className, subtitle }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 backdrop-blur-xl p-5 shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold font-display text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
