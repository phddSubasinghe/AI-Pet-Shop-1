import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80",
        "bg-muted/20 backdrop-blur-sm py-16 px-8 text-center",
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-6">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="font-semibold text-foreground text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
