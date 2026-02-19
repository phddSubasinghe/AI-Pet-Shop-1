import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
  className?: string;
}

export function AdminErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  onRetry,
  actionLabel = "Try again",
  className,
}: AdminErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-border/80",
        "bg-destructive/5 backdrop-blur-sm py-16 px-8 text-center",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-6">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      </div>
      <h3 className="font-semibold text-foreground text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {onRetry && (
        <Button
          variant="outline"
          className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onRetry}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
