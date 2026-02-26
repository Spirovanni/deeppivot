"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  Save,
  User,
  Mail,
  Phone,
  Linkedin,
  AlertTriangle,
} from "lucide-react";
import { updateProfile, uploadAvatar } from "@/src/lib/actions/profile";
import type { UserProfile } from "@/src/lib/actions/profile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile;
  clerkImageUrl: string;
}

// ─── Avatar section ───────────────────────────────────────────────────────────

function AvatarSection({
  profile,
  clerkImageUrl,
}: {
  profile: UserProfile;
  clerkImageUrl: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? clerkImageUrl);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);

    const formData = new FormData();
    formData.set("avatar", file);

    setError(null);
    startTransition(async () => {
      try {
        const result = await uploadAvatar(formData);
        setAvatarUrl(result.avatarUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setAvatarUrl(profile.avatarUrl ?? clerkImageUrl); // revert
      }
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={`${profile.firstName} ${profile.lastName}`}
          className="size-20 rounded-full object-cover border-2 border-border"
          onError={() => setAvatarUrl(clerkImageUrl)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Change avatar"
        >
          <Camera className="size-3.5" aria-hidden="true" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Upload avatar image"
        />
      </div>
      <div>
        <p className="text-sm font-medium">{profile.firstName} {profile.lastName}</p>
        <p className="text-xs text-muted-foreground">{profile.email}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isPending ? "Uploading…" : "Click the camera icon to update"}
        </p>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    </div>
  );
}

// ─── Profile form ─────────────────────────────────────────────────────────────

function ProfileForm({ profile }: { profile: UserProfile }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio ?? "",
    phone: profile.phone ?? "",
    pronouns: profile.pronouns ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
  });

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await updateProfile(form);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="first-name">First name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="first-name"
              value={form.firstName}
              onChange={update("firstName")}
              className="pl-9"
              placeholder="First name"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="last-name">Last name</Label>
          <Input
            id="last-name"
            value={form.lastName}
            onChange={update("lastName")}
            placeholder="Last name"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="pl-9 opacity-60 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-muted-foreground">Email is managed by your auth provider and cannot be changed here.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pronouns">Pronouns</Label>
        <Input
          id="pronouns"
          value={form.pronouns}
          onChange={update("pronouns")}
          placeholder="e.g. she/her, he/him, they/them"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            className="pl-9"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkedin">LinkedIn URL</Label>
        <div className="relative">
          <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="linkedin"
            type="url"
            value={form.linkedinUrl}
            onChange={update("linkedinUrl")}
            className="pl-9"
            placeholder="https://linkedin.com/in/your-handle"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={update("bio")}
          rows={3}
          placeholder="A short description about yourself and your career goals…"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">{form.bio.length}/500</p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile saved successfully.</p>
      )}

      <Button type="submit" disabled={isPending} className="gap-2 w-full sm:w-auto">
        <Save className="size-4" aria-hidden="true" />
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

// ─── Danger zone ──────────────────────────────────────────────────────────────

function DangerZone({ profile }: { profile: UserProfile }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (confirmText !== "DELETE") {
      setError('Type "DELETE" to confirm.');
      return;
    }
    startTransition(async () => {
      try {
        const { softDeleteAccount } = await import("@/src/lib/actions/profile");
        await softDeleteAccount();
        window.location.href = "/sign-out";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete account");
      }
    });
  };

  return (
    <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="size-4" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Danger Zone</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Deleting your account is a soft delete — your data is preserved for analytics but you will
        lose access immediately. This action cannot be undone.
      </p>
      {!confirming ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setConfirming(true)}
        >
          Delete account
        </Button>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="confirm-delete" className="text-xs text-destructive">
            Type <strong>DELETE</strong> to confirm account deletion
          </Label>
          <div className="flex gap-2">
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="border-destructive/50 focus-visible:ring-destructive max-w-36"
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending || confirmText !== "DELETE"}
            >
              {isPending ? "Deleting…" : "Confirm delete"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setConfirming(false); setConfirmText(""); setError(null); }}>
              Cancel
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileSettingsClient({ profile, clerkImageUrl }: Props) {
  return (
    <div className="space-y-6">
      {/* Avatar + name card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Profile photo</CardTitle>
            <Badge variant="outline" className="text-xs capitalize">{profile.role}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AvatarSection profile={profile} clerkImageUrl={clerkImageUrl} />
        </CardContent>
      </Card>

      {/* Profile fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      {/* Account danger zone */}
      <DangerZone profile={profile} />
    </div>
  );
}
