import { cn } from "@/lib/utils";

interface StepperProps {
  steps: number;
  currentStep: number;
  "aria-label"?: string;
}

export const Stepper = ({ steps, currentStep, "aria-label": ariaLabel }: StepperProps) => (
  <nav
    aria-label={ariaLabel ?? "Progress"}
    className="flex items-center justify-center gap-2 sm:gap-4"
  >
    {Array.from({ length: steps }, (_, i) => (
      <div key={i} className="flex items-center">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
            i + 1 === currentStep
              ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
              : i + 1 < currentStep
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
          )}
          aria-current={i + 1 === currentStep ? "step" : undefined}
        >
          {i + 1}
        </span>
        {i < steps - 1 && (
          <span
            className={cn(
              "mx-1 h-0.5 w-6 sm:w-10 rounded-full transition-colors",
              i + 1 < currentStep ? "bg-primary/40" : "bg-muted"
            )}
            aria-hidden
          />
        )}
      </div>
    ))}
  </nav>
);
