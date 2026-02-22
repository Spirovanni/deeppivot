"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Linkedin, ExternalLink, Loader2, CheckCircle2, Clock } from "lucide-react";
import { requestConnection } from "@/src/lib/actions/mentors";

interface Mentor {
  id: number;
  name: string;
  title: string;
  industry: string;
  expertise: string[];
  bio: string;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  contactUrl: string | null;
}

type ConnectionStatus = "none" | "pending" | "accepted" | "declined";

interface MentorCardProps {
  mentor: Mentor;
  connectionStatus: ConnectionStatus;
}

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-pink-500",
  "bg-rose-500", "bg-orange-500", "bg-teal-500",
  "bg-cyan-500", "bg-amber-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function MentorCard({ mentor, connectionStatus: initialStatus }: MentorCardProps) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleConnect = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const message = fd.get("message") as string;

    startTransition(async () => {
      await requestConnection(mentor.id, message || undefined);
      setStatus("pending");
      setConnectOpen(false);
    });
  };

  const avatarColor = getAvatarColor(mentor.name);
  const initials = getInitials(mentor.name);

  return (
    <>
      <Card className="flex flex-col transition-shadow hover:shadow-md">
        <CardContent className="flex flex-1 flex-col gap-4 p-5">
          {/* Avatar + name */}
          <div className="flex items-start gap-3">
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor}`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{mentor.name}</p>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {mentor.industry}
              </Badge>
            </div>
          </div>

          {/* Bio */}
          <p className="line-clamp-3 text-sm text-muted-foreground">{mentor.bio}</p>

          {/* Expertise tags */}
          <div className="flex flex-wrap gap-1.5">
            {mentor.expertise.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer actions */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {mentor.linkedinUrl && (
                <a
                  href={mentor.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="size-4" />
                </a>
              )}
              {mentor.contactUrl && (
                <a
                  href={mentor.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Website"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>

            {status === "pending" && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                Pending
              </div>
            )}
            {status === "accepted" && (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="size-3.5" />
                Connected
              </div>
            )}
            {(status === "none" || status === "declined") && (
              <Button size="sm" onClick={() => setConnectOpen(true)}>
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connect dialog */}
      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect with {mentor.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConnect} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="connect-message">
                Message{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="connect-message"
                name="message"
                placeholder={`Hi ${mentor.name.split(" ")[0]}, I'd love to connect and get your perspective on...`}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConnectOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Send Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
