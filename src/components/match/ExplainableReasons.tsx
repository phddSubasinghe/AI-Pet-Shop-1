import { CheckCircle2 } from "lucide-react";
import type { ExplainableReasons as ExplainableReasonsType } from "@/data/matchMockData";

interface ExplainableReasonsProps {
  data: ExplainableReasonsType;
  className?: string;
}

export function ExplainableReasons({ data, className = "" }: ExplainableReasonsProps) {
  return (
    <section
      className={`glass-card rounded-2xl p-6 sm:p-8 border border-white/10 dark:border-white/5 ${className}`}
      style={{
        background: "hsl(var(--glass-bg))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      aria-labelledby="why-this-match-heading"
    >
      <h2 id="why-this-match-heading" className="font-display text-xl font-bold text-foreground mb-4">
        Why this match?
      </h2>
      <ul className="space-y-3" role="list">
        {data.reasons.map((reason, index) => (
          <li
            key={index}
            className="flex gap-3 text-sm sm:text-base text-muted-foreground"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
