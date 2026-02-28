"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/src/lib/toast";

interface JobDescription {
  id: number;
  title: string;
  company: string | null;
  status: string;
}

interface InterviewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Optional job tracker card context — used to pre-select the best
   * matching JD from the library by fuzzy-matching position + company.
   */
  initialJobQuery?: string;
}

export function InterviewSettingsModal({
  isOpen,
  onClose,
  initialJobQuery,
}: InterviewSettingsModalProps) {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [isLoadingJDs, setIsLoadingJDs] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedJdId, setSelectedJdId] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>("general");

  const router = useRouter();

  // Fetch user's extracted job descriptions whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchJDs = async () => {
      try {
        setIsLoadingJDs(true);
        const response = await fetch("/api/job-descriptions");
        if (!response.ok) throw new Error("Failed to fetch job descriptions");
        const data: JobDescription[] = await response.json();
        const extracted = data.filter((jd) => jd.status === "extracted");
        setJobDescriptions(extracted);

        // Auto-select by fuzzy match on initialJobQuery, fallback to first item
        if (extracted.length > 0) {
          if (initialJobQuery) {
            const query = initialJobQuery.toLowerCase();
            const match = extracted.find(
              (jd) =>
                jd.title.toLowerCase().includes(query) ||
                (jd.company && jd.company.toLowerCase().includes(query)) ||
                query.includes(jd.title.toLowerCase())
            );
            setSelectedJdId(match ? match.id.toString() : extracted[0].id.toString());
          } else {
            setSelectedJdId(extracted[0].id.toString());
          }
        }
      } catch (error) {
        console.error("Error loading job descriptions:", error);
        toast.error("Failed to load job descriptions. Please try again.");
      } finally {
        setIsLoadingJDs(false);
      }
    };

    fetchJDs();
    // Reset session type each time the modal opens
    setSessionType("general");
  }, [isOpen, initialJobQuery]);

  const handleStartInterview = async () => {
    if (!selectedJdId) {
      toast.error("Please select a job description to practice for.");
      return;
    }

    try {
      setIsStarting(true);

      const response = await fetch("/api/interviews/context-aware/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescriptionId: parseInt(selectedJdId, 10),
          sessionType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || errorData.error || "Failed to start interview"
        );
      }

      const data = await response.json();
      toast.success("Your custom AI interviewer is ready. Connecting…");

      const searchParams = new URLSearchParams({
        jobDescriptionId: selectedJdId,
        sessionType,
        signedUrl: data.signedUrl,
        agentId: data.agentId,
        sessionId: data.sessionId.toString(),
      });

      onClose();
      router.push(`/dashboard/interviews/session?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error starting context-aware interview:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic2 className="size-4 text-primary" />
            Practice for this Job
          </DialogTitle>
          <DialogDescription>
            Sarah will act as a recruiter hiring for the selected role and ask
            targeted questions based on the job requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Target JD picker */}
          <div className="grid gap-2">
            <Label htmlFor="job-description">Target Job Description</Label>
            {isLoadingJDs ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading your saved jobs…
              </div>
            ) : jobDescriptions.length === 0 ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  No extracted job descriptions found.{" "}
                  <a
                    href="/dashboard/job-descriptions"
                    className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
                    onClick={onClose}
                  >
                    Add one in the JD Library
                  </a>{" "}
                  before practicing.
                </span>
              </div>
            ) : (
              <Select value={selectedJdId} onValueChange={setSelectedJdId}>
                <SelectTrigger id="job-description">
                  <SelectValue placeholder="Select a job description" />
                </SelectTrigger>
                <SelectContent>
                  {jobDescriptions.map((jd) => (
                    <SelectItem key={jd.id} value={jd.id.toString()}>
                      {jd.title}
                      {jd.company ? ` at ${jd.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Interview focus */}
          <div className="grid gap-2">
            <Label htmlFor="session-type">Interview Focus</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger id="session-type">
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General (Balanced)</SelectItem>
                <SelectItem value="behavioral">
                  Behavioral (STAR Method)
                </SelectItem>
                <SelectItem value="technical">
                  Technical (Skills &amp; Tools)
                </SelectItem>
                <SelectItem value="situational">
                  Situational (Scenario-based)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isStarting}>
            Cancel
          </Button>
          <Button
            onClick={handleStartInterview}
            disabled={isStarting || jobDescriptions.length === 0 || !selectedJdId}
          >
            {isStarting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Start Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
