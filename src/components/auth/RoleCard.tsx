import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type AuthRole = "adopter" | "shelter" | "seller";

interface RoleCardProps {
  role: AuthRole;
  label: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  "aria-label"?: string;
}

export const RoleCard = ({
  role,
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
  "aria-label": ariaLabel,
}: RoleCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    aria-label={ariaLabel ?? `Select ${label}`}
    aria-pressed={selected}
    className={cn(
      "w-full text-left rounded-xl border-2 p-5 sm:p-6 transition-all duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "hover:border-primary/40 hover:shadow-md",
      selected
        ? "border-primary bg-primary/5 shadow-md"
        : "border-border bg-background/60 backdrop-blur-sm"
    )}
  >
    <div
      className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors",
        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="font-semibold text-foreground text-lg">{label}</h3>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </button>
);
