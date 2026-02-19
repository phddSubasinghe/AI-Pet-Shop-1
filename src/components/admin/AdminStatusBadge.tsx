import { statusBadgeColor } from "@/lib/adminUtils";
import type { VerificationStatus, AdoptionRequestStatus, UserStatus } from "@/types/admin";
import { cn } from "@/lib/utils";

interface AdminStatusBadgeProps {
  status: string;
  variant?: "verification" | "adoption" | "user";
  className?: string;
}

export function AdminStatusBadge({
  status,
  variant = "verification",
  className,
}: AdminStatusBadgeProps) {
  const colors = statusBadgeColor(
    status as VerificationStatus | AdoptionRequestStatus | UserStatus,
    variant
  );
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colors,
        className
      )}
    >
      {status}
    </span>
  );
}
