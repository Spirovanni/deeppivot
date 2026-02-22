"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ARCHETYPES } from "@/src/lib/archetypes";

export interface ReviewItem {
  id: number;
  careerArchetypeId: number;
  sessionId: number;
  userId: number;
  feedbackContent: string;
  aiArchetypeName: string;
  aiStrengths: unknown;
  aiGrowthAreas: unknown;
  status: string;
  overrideArchetypeName: string | null;
  createdAt: string;
  userEmail: string;
  userName: string;
}

interface ArchetypeReviewQueueProps {
  items: ReviewItem[];
}

export function ArchetypeReviewQueue({ items: initialItems }: ArchetypeReviewQueueProps) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState<number | null>(null);
  const [overrideId, setOverrideId] = useState<number | null>(null);
  const [overrideArchetype, setOverrideArchetype] = useState<string>("");

  const pending = items.filter((i) => i.status === "pending");
  const reviewed = items.filter((i) => i.status !== "pending");

  async function handleAction(id: number, action: "approve" | "override") {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/archetype-review/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "override"
            ? { action: "override", overrideArchetypeName: overrideArchetype }
            : { action: "approve" }
        ),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? res.statusText);
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                status: action === "approve" ? "approved" : "overridden",
                overrideArchetypeName:
                  action === "override" ? overrideArchetype : null,
              }
            : i
        )
      );
      setOverrideId(null);
      setOverrideArchetype("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  const strengths = (arr: unknown[]) =>
    Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string") : []
  const growthAreas = (arr: unknown[]) =>
    Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string") : []
  const formatDate = (s: string) =>
    new Date(s).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Pending ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((item) => (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {item.userName} ({item.userEmail})
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Session {item.sessionId} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <Badge variant="secondary">{item.aiArchetypeName}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Input (interview feedback)
                    </h3>
                    <p className="mt-1 max-h-32 overflow-y-auto rounded border bg-muted/30 p-3 text-sm">
                      {item.feedbackContent}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      AI output
                    </h3>
                    <div className="mt-1 space-y-1 rounded border bg-muted/30 p-3 text-sm">
                      <p>
                        <strong>Archetype:</strong> {item.aiArchetypeName}
                      </p>
                      <p>
                        <strong>Strengths:</strong>{" "}
                        {strengths(item.aiStrengths as unknown[]).join("; ")}
                      </p>
                      <p>
                        <strong>Growth areas:</strong>{" "}
                        {growthAreas(item.aiGrowthAreas as unknown[]).join("; ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={loading !== null}
                      onClick={() => handleAction(item.id, "approve")}
                    >
                      {loading === item.id ? "..." : "Approve"}
                    </Button>
                    {overrideId === item.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded border bg-background px-3 py-1.5 text-sm"
                          value={overrideArchetype}
                          onChange={(e) =>
                            setOverrideArchetype(e.target.value)
                          }
                        >
                          <option value="">Select archetype</option>
                          {ARCHETYPES.map((a) => (
                            <option key={a.id} value={a.name}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            !overrideArchetype || loading !== null
                          }
                          onClick={() =>
                            handleAction(item.id, "override")
                          }
                        >
                          Override
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setOverrideId(null);
                            setOverrideArchetype("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading !== null}
                        onClick={() => setOverrideId(item.id)}
                      >
                        Override
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {reviewed.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Reviewed ({reviewed.length})
          </h2>
          <div className="space-y-4">
            {reviewed.map((item) => (
              <Card key={item.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {item.userName} ({item.userEmail})
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Session {item.sessionId} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.status === "approved" ? "default" : "secondary"
                      }
                    >
                      {item.status === "overridden"
                        ? item.overrideArchetypeName ?? item.aiArchetypeName
                        : item.aiArchetypeName}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {item.status === "approved"
                      ? "Approved"
                      : `Overridden to: ${item.overrideArchetypeName}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <p className="text-muted-foreground">
          No archetype review items yet. Items are added when the career
          archetyping engine processes interview feedback.
        </p>
      )}
    </div>
  );
}
