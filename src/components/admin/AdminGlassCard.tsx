import * as React from "react";
import { cn } from "@/lib/utils";

const AdminGlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-sm",
      "hover:shadow-md transition-shadow duration-200",
      className
    )}
    {...props}
  />
));
AdminGlassCard.displayName = "AdminGlassCard";

const AdminGlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pb-4", className)} {...props} />
));
AdminGlassCardHeader.displayName = "AdminGlassCardHeader";

const AdminGlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-tight text-foreground", className)}
    {...props}
  />
));
AdminGlassCardTitle.displayName = "AdminGlassCardTitle";

const AdminGlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
AdminGlassCardContent.displayName = "AdminGlassCardContent";

export { AdminGlassCard, AdminGlassCardHeader, AdminGlassCardTitle, AdminGlassCardContent };
