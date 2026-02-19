import { cn } from "@/lib/utils";

interface WaveSeparatorProps {
  className?: string;
  flip?: boolean;
}

export const WaveSeparator = ({ className, flip }: WaveSeparatorProps) => (
  <div
    className={cn("w-full overflow-hidden leading-none", className)}
    aria-hidden
  >
    <svg
      viewBox="0 0 1440 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-auto", flip && "scale-y-[-1]")}
      preserveAspectRatio="none"
    >
      <path
        d="M0 60C240 120 480 0 720 60C960 120 1200 0 1440 60V120H0V60Z"
        className="fill-background"
      />
    </svg>
  </div>
);
