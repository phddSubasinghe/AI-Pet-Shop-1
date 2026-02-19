/**
 * Inverted curve/wave separator for dashboard section headers.
 * Subtle decorative element for premium SaaS look.
 */
import { cn } from "@/lib/utils";

interface SectionWaveProps {
  className?: string;
  /** Flip wave upside-down */
  flip?: boolean;
}

export function SectionWave({ className, flip }: SectionWaveProps) {
  return (
    <div
      className={cn("w-full h-8 flex-shrink-0 overflow-hidden", flip && "rotate-180", className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="w-full h-full text-muted/30 fill-current"
      >
        <path d="M0,64 C300,120 600,0 900,64 C1050,92 1150,80 1200,64 L1200,120 L0,120 Z" />
      </svg>
    </div>
  );
}
