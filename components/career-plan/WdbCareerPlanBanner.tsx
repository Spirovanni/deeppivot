"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Landmark, ChevronDown, ChevronUp, Plus } from "lucide-react";
import {
  WDB_GOAL_CATEGORIES,
  createWdbAlignedMilestones,
  generateWdbMilestoneTemplates,
  type WdbGoalCategory,
  type WdbStatus,
} from "@/src/lib/actions/wdb-career-plan";

interface Props {
  wdbStatus: WdbStatus;
}

export function WdbCareerPlanBanner({ wdbStatus }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<WdbGoalCategory | "">("");
  const [targetCredential, setTargetCredential] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMilestones = () => {
    if (!selectedGoal) {
      setError("Please select a WDB goal area.");
      return;
    }

    const templates = generateWdbMilestoneTemplates(
      selectedGoal as WdbGoalCategory,
      targetCredential || undefined
    );

    if (templates.length === 0) {
      setError("No templates available for this goal area. Please add milestones manually.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createWdbAlignedMilestones(templates);
        setSuccess(true);
        setExpanded(false);
        setSelectedGoal("");
        setTargetCredential("");
        // Trigger page refresh to show new milestones
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add WDB milestones");
      }
    });
  };

  return (
    <div className="px-6 pt-4">
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Landmark className="size-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                WDB Case Plan Linked
              </CardTitle>
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                WDB Client
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 h-7 px-2"
              aria-expanded={expanded}
              aria-controls="wdb-panel"
            >
              {expanded ? (
                <ChevronUp className="size-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-4" aria-hidden="true" />
              )}
              <span className="sr-only">{expanded ? "Collapse" : "Expand"} WDB panel</span>
            </Button>
          </div>
          <CardDescription className="text-blue-700/80 dark:text-blue-300/80 text-xs">
            Your career plan is linked to WDB Case Plan{" "}
            {wdbStatus.casePlanId ? (
              <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">
                {wdbStatus.casePlanId}
              </code>
            ) : (
              "on file"
            )}
            . You can auto-populate milestones from your Individual Employment Plan (IEP) goals.
          </CardDescription>
        </CardHeader>

        {expanded && (
          <CardContent id="wdb-panel" className="pt-0 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="wdb-goal" className="text-xs font-medium">
                  WDB Goal Area (IEP)
                </Label>
                <Select
                  value={selectedGoal}
                  onValueChange={(v) => setSelectedGoal(v as WdbGoalCategory)}
                >
                  <SelectTrigger id="wdb-goal" className="h-8 text-xs">
                    <SelectValue placeholder="Select a goal area…" />
                  </SelectTrigger>
                  <SelectContent>
                    {WDB_GOAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wdb-credential" className="text-xs font-medium">
                  Target Credential (optional)
                </Label>
                <Input
                  id="wdb-credential"
                  value={targetCredential}
                  onChange={(e) => setTargetCredential(e.target.value)}
                  placeholder="e.g. CompTIA Security+, CNA License"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                WDB milestones added to your career plan successfully.
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button
              size="sm"
              onClick={handleAddMilestones}
              disabled={isPending || !selectedGoal}
              className="gap-1.5 h-7 text-xs"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {isPending ? "Adding milestones…" : "Add WDB-aligned milestones"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Milestones are based on standard WIOA IEP goals. You can edit or remove them
              from your career plan at any time.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
