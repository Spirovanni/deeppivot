"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Video,
  FileText,
  Star,
  Link as LinkIcon,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Send,
  Clock,
} from "lucide-react";
import {
  getLearnerSessions,
  createMentorReferral,
  addMentorResource,
  deleteMentorResource,
} from "@/src/lib/actions/mentor-tools";
import type {
  LearnerSummary,
  ReferralRecord,
  MentorResource,
  SessionDetail,
} from "@/src/lib/actions/mentor-tools";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialLearners: LearnerSummary[];
  initialReferrals: ReferralRecord[];
  initialResources: MentorResource[];
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "learners", label: "Learners", icon: Users },
  { id: "referrals", label: "Referrals", icon: Send },
  { id: "resources", label: "Resources", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreColor(score: number | null | undefined) {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}

// ─── Session card ─────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: SessionDetail }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs capitalize">
            {session.sessionType}
          </Badge>
          <Badge
            variant={session.status === "completed" ? "secondary" : "outline"}
            className="text-xs capitalize"
          >
            {session.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3" aria-hidden="true" />
          {formatDate(session.startedAt)}
          {session.overallScore !== null && (
            <span className={`font-semibold ${scoreColor(session.overallScore)}`}>
              Score: {session.overallScore}/100
            </span>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        {session.recordings.length > 0 && (
          <span className="flex items-center gap-1">
            <Video className="size-3" aria-hidden="true" />
            {session.recordings.length} recording{session.recordings.length > 1 ? "s" : ""}
          </span>
        )}
        {session.transcripts.length > 0 && (
          <span className="flex items-center gap-1">
            <FileText className="size-3" aria-hidden="true" />
            {session.transcripts.length} transcript{session.transcripts.length > 1 ? "s" : ""}
          </span>
        )}
        {session.feedback.length > 0 && (
          <span className="flex items-center gap-1">
            <Star className="size-3" aria-hidden="true" />
            {session.feedback.length} feedback item{session.feedback.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Expand/collapse */}
      {(session.recordings.length > 0 || session.transcripts.length > 0 || session.feedback.length > 0) && (
        <>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <><ChevronUp className="size-3" aria-hidden="true" /> Hide details</>
            ) : (
              <><ChevronDown className="size-3" aria-hidden="true" /> View details</>
            )}
          </button>

          {expanded && (
            <div className="space-y-3 pt-2 border-t">
              {session.recordings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Recordings
                  </p>
                  <div className="space-y-1">
                    {session.recordings.map((rec) => (
                      <a
                        key={rec.id}
                        href={rec.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                      >
                        <Video className="size-3" aria-hidden="true" />
                        Recording — {formatDate(rec.createdAt)}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {session.transcripts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Transcripts
                  </p>
                  <div className="space-y-1">
                    {session.transcripts.map((tr) => (
                      <a
                        key={tr.id}
                        href={tr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                      >
                        <FileText className="size-3" aria-hidden="true" />
                        Transcript — {formatDate(tr.createdAt)}
                        <ExternalLink className="size-3" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {session.feedback.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    AI Feedback
                  </p>
                  <div className="space-y-2">
                    {session.feedback.map((fb) => (
                      <div key={fb.id} className="rounded bg-muted/50 p-3 text-xs space-y-1">
                        {fb.score !== null && (
                          <p className={`font-semibold ${scoreColor(fb.score)}`}>
                            Sentiment score: {fb.score}/100
                          </p>
                        )}
                        <p className="text-muted-foreground whitespace-pre-wrap">{fb.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Learner tab ──────────────────────────────────────────────────────────────

function LearnersTab({ learners }: { learners: LearnerSummary[] }) {
  const [selectedLearner, setSelectedLearner] = useState<LearnerSummary | null>(null);
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectLearner = async (learner: LearnerSummary) => {
    if (selectedLearner?.userId === learner.userId) {
      setSelectedLearner(null);
      setSessions([]);
      return;
    }
    setSelectedLearner(learner);
    setLoading(true);
    setError(null);
    try {
      const data = await getLearnerSessions(learner.userId);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  if (learners.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Users className="size-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
        <p className="font-medium">No learners assigned yet</p>
        <p className="text-sm mt-1">Learners will appear here once connected to your mentor profile.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Learner list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {learners.length} Learner{learners.length !== 1 ? "s" : ""}
        </p>
        {learners.map((learner) => (
          <button
            key={learner.userId}
            type="button"
            onClick={() => handleSelectLearner(learner)}
            className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              selectedLearner?.userId === learner.userId ? "border-primary bg-primary/5" : ""
            }`}
            aria-pressed={selectedLearner?.userId === learner.userId}
          >
            <p className="text-sm font-medium">{learner.name}</p>
            <p className="text-xs text-muted-foreground truncate">{learner.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {learner.sessionCount} session{learner.sessionCount !== 1 ? "s" : ""}
            </p>
          </button>
        ))}
      </div>

      {/* Session detail panel */}
      <div>
        {!selectedLearner ? (
          <div className="flex items-center justify-center h-48 rounded-lg border border-dashed text-muted-foreground">
            <p className="text-sm">Select a learner to view their sessions</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center justify-center h-48 rounded-lg border border-dashed text-muted-foreground">
            <p className="text-sm">{selectedLearner.name} has no interview sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {selectedLearner.name}'s sessions ({sessions.length})
            </p>
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Referrals tab ────────────────────────────────────────────────────────────

function ReferralsTab({
  learners,
  initialReferrals,
}: {
  learners: LearnerSummary[];
  initialReferrals: ReferralRecord[];
}) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    learnerId: "",
    referralType: "general" as const,
    targetName: "",
    targetUrl: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!form.learnerId || !form.targetName || !form.notes) {
      setError("Learner, target, and notes are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await createMentorReferral({
          learnerId: parseInt(form.learnerId),
          referralType: form.referralType as "job_opening" | "wdb_program" | "employer" | "general",
          targetName: form.targetName,
          targetUrl: form.targetUrl || undefined,
          notes: form.notes,
        });
        const learner = learners.find((l) => l.userId === parseInt(form.learnerId));
        setReferrals((prev) => [
          {
            id: Date.now(),
            learnerId: parseInt(form.learnerId),
            learnerName: learner?.name ?? "Unknown",
            referralType: form.referralType,
            targetName: form.targetName,
            targetUrl: form.targetUrl || null,
            notes: form.notes,
            createdAt: new Date(),
          },
          ...prev,
        ]);
        setForm({ learnerId: "", referralType: "general", targetName: "", targetUrl: "", notes: "" });
        setShowForm(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create referral");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Log referrals to WDB programs, job openings, or employer partners.
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="gap-2"
          aria-expanded={showForm}
        >
          <Plus className="size-4" aria-hidden="true" />
          New Referral
        </Button>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          Referral logged successfully.
        </div>
      )}

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="referral-learner">Learner *</Label>
                <select
                  id="referral-learner"
                  value={form.learnerId}
                  onChange={(e) => setForm((f) => ({ ...f, learnerId: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select learner…</option>
                  {learners.map((l) => (
                    <option key={l.userId} value={l.userId}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="referral-type">Referral Type *</Label>
                <select
                  id="referral-type"
                  value={form.referralType}
                  onChange={(e) => setForm((f) => ({ ...f, referralType: e.target.value as typeof form.referralType }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="job_opening">Job Opening</option>
                  <option value="wdb_program">WDB Program</option>
                  <option value="employer">Employer Partner</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referral-target">Target / Employer *</Label>
              <Input
                id="referral-target"
                placeholder="e.g. Acme Corp, WDB Training Grant, Software Engineer at TechCo"
                value={form.targetName}
                onChange={(e) => setForm((f) => ({ ...f, targetName: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referral-url">URL (optional)</Label>
              <Input
                id="referral-url"
                type="url"
                placeholder="https://…"
                value={form.targetUrl}
                onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referral-notes">Notes *</Label>
              <Textarea
                id="referral-notes"
                placeholder="Why are you making this referral? Any preparation tips for the learner?"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
                <Send className="size-4" aria-hidden="true" />
                {isPending ? "Logging…" : "Log Referral"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowForm(false); setError(null); }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {referrals.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Send className="size-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p className="font-medium">No referrals logged yet</p>
          <p className="text-sm mt-1">Use the form above to log your first referral.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((ref) => (
            <div key={ref.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{ref.targetName}</p>
                  <p className="text-xs text-muted-foreground">for {ref.learnerName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {ref.referralType.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(ref.createdAt)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{ref.notes}</p>
              {ref.targetUrl && (
                <a
                  href={ref.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <LinkIcon className="size-3" aria-hidden="true" />
                  View link
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Resources tab ────────────────────────────────────────────────────────────

const RESOURCE_CATEGORIES = [
  "article", "video", "tool", "course", "book", "other",
] as const;

function ResourcesTab({ initialResources }: { initialResources: MentorResource[] }) {
  const [resources, setResources] = useState(initialResources);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    url: "",
    description: "",
    category: "article" as (typeof RESOURCE_CATEGORIES)[number],
    sharedWithAll: true,
  });
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!form.title || !form.url) {
      setError("Title and URL are required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await addMentorResource(form);
        const newRes: MentorResource = {
          id: `res_${Date.now()}`,
          ...form,
          createdAt: new Date().toISOString(),
        };
        setResources((prev) => [...prev, newRes]);
        setForm({ title: "", url: "", description: "", category: "article", sharedWithAll: true });
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add resource");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteMentorResource(id);
        setResources((prev) => prev.filter((r) => r.id !== id));
      } catch {
        // silent — UI already removed it optimistically
      }
    });
  };

  const categoryColor: Record<string, string> = {
    article: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    video: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    tool: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    course: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    book: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Curate resources to share with your learners.
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="gap-2"
          aria-expanded={showForm}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add Resource
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="res-title">Title *</Label>
                <Input
                  id="res-title"
                  placeholder="Resource title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-category">Category</Label>
                <select
                  id="res-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof form.category }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {RESOURCE_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="res-url">URL *</Label>
              <Input
                id="res-url"
                type="url"
                placeholder="https://…"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="res-description">Description</Label>
              <Textarea
                id="res-description"
                placeholder="Why is this useful for your learners?"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={form.sharedWithAll}
                onChange={(e) => setForm((f) => ({ ...f, sharedWithAll: e.target.checked }))}
                className="rounded accent-primary"
              />
              Share with all my learners
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={isPending}>
                {isPending ? "Saving…" : "Add Resource"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setShowForm(false); setError(null); }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {resources.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <BookOpen className="size-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
          <p className="font-medium">No resources added yet</p>
          <p className="text-sm mt-1">Add your first resource to share with your learners.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => (
            <div key={res.id} className="rounded-lg border bg-card p-4 space-y-2 group relative">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${categoryColor[res.category] ?? categoryColor.other}`}>
                  {res.category}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(res.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  aria-label={`Remove ${res.title}`}
                  disabled={isPending}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm font-medium">{res.title}</p>
              {res.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{res.description}</p>
              )}
              <div className="flex items-center justify-between">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="size-3" aria-hidden="true" />
                  Open link
                </a>
                {res.sharedWithAll && (
                  <span className="text-xs text-muted-foreground">Shared with all</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MentorDashboardClient({ initialLearners, initialReferrals, initialResources }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("learners");

  const totalSessions = initialLearners.reduce((sum, l) => sum + l.sessionCount, 0);
  const stats = [
    { label: "Total Learners", value: initialLearners.length, icon: Users, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
    { label: "Total Sessions", value: totalSessions, icon: Video, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Referrals Made", value: initialReferrals.length, icon: Send, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Resources Shared", value: initialResources.length, icon: BookOpen, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
            <div className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {tab.label}
              {tab.id === "learners" && initialLearners.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0">
                  {initialLearners.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div role="tabpanel">
        {activeTab === "learners" && <LearnersTab learners={initialLearners} />}
        {activeTab === "referrals" && (
          <ReferralsTab learners={initialLearners} initialReferrals={initialReferrals} />
        )}
        {activeTab === "resources" && <ResourcesTab initialResources={initialResources} />}
      </div>
    </div>
  );
}
