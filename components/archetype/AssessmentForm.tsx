"use client";

import { useState, useTransition } from "react";
import { QUESTIONS, STEPS } from "@/src/lib/archetypes";
import { submitAssessment } from "@/src/lib/actions/archetype";
import { cn } from "@/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const LIKERT_LABELS = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

export function AssessmentForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();

  const currentQuestions = STEPS[step];
  const totalSteps = STEPS.length;
  const isLastStep = step === totalSteps - 1;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const stepAnswered = currentQuestions.every((q) => answers[q.id] !== undefined);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (isLastStep) {
      startTransition(async () => {
        await submitAssessment(answers);
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{Math.round(progressPct)}% complete</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {currentQuestions.map((q, idx) => (
          <div key={q.id} className="space-y-3">
            <p className="font-medium leading-snug">
              <span className="mr-2 text-muted-foreground">{step * 6 + idx + 1}.</span>
              {q.text}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((val) => {
                const selected = answers[q.id] === val;
                return (
                  <button
                    key={val}
                    onClick={() => handleAnswer(q.id, val)}
                    title={LIKERT_LABELS[val - 1]}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border py-3 text-xs transition-all",
                      selected
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}
                  >
                    <span className="text-base font-bold">{val}</span>
                    <span className="hidden text-center leading-tight opacity-60 sm:block">
                      {LIKERT_LABELS[val - 1].split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-10 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || isPending}
        >
          <ChevronLeft className="mr-1 size-4" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!stepAnswered || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Analysing…
            </>
          ) : isLastStep ? (
            "See My Archetype →"
          ) : (
            <>
              Next
              <ChevronRight className="ml-1 size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
