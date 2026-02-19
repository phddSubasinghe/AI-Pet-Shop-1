import { Progress } from "@/components/ui/progress";
import type { Pet } from "@/data/matchMockData";
import { compatibilityLabels } from "@/data/matchMockData";

interface CompatibilityBreakdownProps {
  breakdown: Pet["breakdown"];
  className?: string;
}

export function CompatibilityBreakdown({ breakdown, className = "" }: CompatibilityBreakdownProps) {
  const entries = (Object.keys(breakdown) as (keyof typeof breakdown)[]).map((key) => ({
    key,
    label: compatibilityLabels[key],
    value: breakdown[key],
  }));

  return (
    <section
      className={`glass-card rounded-2xl p-6 sm:p-8 border border-white/10 dark:border-white/5 ${className}`}
      style={{
        background: "hsl(var(--glass-bg))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      aria-labelledby="compatibility-breakdown-heading"
    >
      <h2 id="compatibility-breakdown-heading" className="font-display text-xl font-bold text-foreground mb-6">
        Compatibility breakdown
      </h2>
      <dl className="space-y-4">
        {entries.map(({ key, label, value }) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium text-foreground" aria-label={`${label}: ${value}%`}>
                {value}%
              </dd>
            </div>
            <Progress value={value} className="h-2" aria-hidden />
          </div>
        ))}
      </dl>
    </section>
  );
}
