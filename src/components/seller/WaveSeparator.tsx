/**
 * Inverted SVG curve/wave for dashboard header sections (premium SaaS).
 */
interface WaveSeparatorProps {
  className?: string;
  /** Flip wave upside-down for bottom of section */
  flip?: boolean;
}

export function WaveSeparator({ className = "", flip }: WaveSeparatorProps) {
  return (
    <div
      className={`w-full overflow-hidden pointer-events-none ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        className={`w-full h-8 text-background ${flip ? "rotate-180" : ""}`}
      >
        <path
          fill="currentColor"
          d="M0 40V20C200 0 400 20 600 20s400-20 600-20v20H0z"
          opacity="0.03"
        />
        <path
          fill="currentColor"
          d="M0 40V25c150-10 300 5 450 5s300-15 450-5v15H900c150 0 300-10 300-10V40H0z"
          opacity="0.06"
        />
      </svg>
    </div>
  );
}
