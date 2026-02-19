import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  livingSpace: "Living space",
  energyLevel: "Energy level",
  experience: "Experience",
  kids: "Kids & family",
  specialCare: "Special care",
};

interface CompatibilityBarProps {
  label: string;
  value: number;
  className?: string;
}

export function CompatibilityBar({ label, value, className }: CompatibilityBarProps) {
  const displayLabel = LABELS[label] ?? label;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{displayLabel}</span>
        <span className="font-medium text-foreground" aria-label={`${displayLabel} ${value} percent`}>
          {value}%
        </span>
      </div>
      <Progress value={value} className="h-2 transition-all duration-500" aria-hidden />
    </div>
  );
}

interface CompatibilityBreakdownProps {
  compatibility: {
    livingSpace: number;
    energyLevel: number;
    experience: number;
    kids: number;
    specialCare: number;
  };
  className?: string;
}

export function CompatibilityBreakdownView({ compatibility, className }: CompatibilityBreakdownProps) {
  const entries = Object.entries(compatibility) as [keyof typeof compatibility, number][];
  return (
    <div className={cn("space-y-4", className)} role="list">
      {entries.map(([key, value]) => (
        <CompatibilityBar key={key} label={key} value={value} />
      ))}
    </div>
  );
}
