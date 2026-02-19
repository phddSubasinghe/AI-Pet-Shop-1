import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Enable hover lift effect */
  hoverLift?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hoverLift = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md shadow-sm",
        "transition-all duration-200 ease-out",
        hoverLift && "hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
