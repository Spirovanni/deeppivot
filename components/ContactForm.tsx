"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    function set(key: keyof typeof form, val: string) {
        setForm((p) => ({ ...p, [key]: val }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setErrorMsg("");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to send");
            setStatus("success");
        } catch (err) {
            setStatus("error");
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
        }
    }

    if (status === "success") {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="size-12 text-green-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Message sent!</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                    Thanks for reaching out. We&apos;ll get back to you at <strong>{form.email}</strong> within 1–2 business days.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {status === "error" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {errorMsg}
                </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Name *</label>
                    <input
                        required
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Your full name"
                        className="w-full rounded-lg border bg-muted/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Email *</label>
                    <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border bg-muted/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5">Subject *</label>
                <input
                    required
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                    placeholder="What can we help you with?"
                    className="w-full rounded-lg border bg-muted/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1.5">Message *</label>
                <textarea
                    required
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    rows={5}
                    placeholder="Tell us more about your question or feedback..."
                    className="w-full rounded-lg border bg-muted/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                />
            </div>
            <button
                type="submit"
                disabled={status === "loading"}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
                <Send className="size-4" />
                {status === "loading" ? "Sending..." : "Send Message"}
            </button>
        </form>
    );
}
