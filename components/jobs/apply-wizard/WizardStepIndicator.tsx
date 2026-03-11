import { Check } from "lucide-react";
import { cn } from "@/utils";

const STEPS = ["Resume", "Cover Letter", "Review"] as const;

export function WizardStepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3;
        const isCompleted = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8",
                  isCompleted || isActive ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "bg-primary text-primary-foreground",
                  !isCompleted && !isActive && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="size-3.5" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
