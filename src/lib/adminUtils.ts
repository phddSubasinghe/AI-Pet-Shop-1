/**
 * Admin dashboard helpers: formatting, status badges, counts.
 */

import type { VerificationStatus, AdoptionRequestStatus, UserStatus } from "@/types/admin";

export function formatLKR(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const verificationColors: Record<VerificationStatus, string> = {
  Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  Verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Rejected: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

const adoptionStatusColors: Record<AdoptionRequestStatus, string> = {
  Requested: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  "Under Review": "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "Interview Scheduled": "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  Approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Rejected: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  Cancelled: "bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30",
};

const userStatusColors: Record<UserStatus, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  blocked: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
};

export function statusBadgeColor(
  status: VerificationStatus | AdoptionRequestStatus | UserStatus,
  variant: "verification" | "adoption" | "user" = "verification"
): string {
  if (variant === "adoption" && status in adoptionStatusColors) {
    return adoptionStatusColors[status as AdoptionRequestStatus];
  }
  if (variant === "user" && status in userStatusColors) {
    return userStatusColors[status as UserStatus];
  }
  return verificationColors[status as VerificationStatus] ?? "bg-muted text-muted-foreground";
}

/** Count items by status. Generic helper. */
export function countsByStatus<T extends { status: string }>(
  items: T[],
  statusKeys: string[]
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(statusKeys.map((k) => [k, 0]));
  for (const item of items) {
    if (item.status in counts) counts[item.status]++;
  }
  return counts;
}
