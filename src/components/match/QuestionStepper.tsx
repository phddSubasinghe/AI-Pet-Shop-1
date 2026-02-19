import { cn } from "@/lib/utils";

interface QuestionStepperProps {
  currentStep: number;
  totalSteps: number;
  steps: { label: string }[];
  className?: string;
}

export function QuestionStepper({ currentStep, totalSteps, steps, className }: QuestionStepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-center justify-between" role="list">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          return (
            <li
              key={step.label}
              className={cn(
                "flex flex-1 items-center last:flex-none",
                index < steps.length - 1 && "pr-2 sm:pr-4",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <div className="flex flex-col items-center flex-1">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    !isComplete && !isCurrent && "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  {isComplete ? (
                    <span aria-hidden>✓</span>
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium hidden sm:block",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 sm:mx-4",
                    stepNumber < currentStep ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
