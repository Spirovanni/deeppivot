"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Info } from "lucide-react";

export default function NewBlogPostPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        author: "DeepPivot Team",
        tags: "",
        excerpt: "",
        content: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerateSlug = () => {
        if (!formData.title) return;
        const generatedSlug = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

        setFormData(prev => ({ ...prev, slug: generatedSlug }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSaving(true);

        try {
            const res = await fetch("/api/admin/blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create post");
            }

            router.push("/admin/blog");
            router.refresh();

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred.");
            }
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/blog"
                    className="flex items-center justify-center size-8 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                    <ArrowLeft className="size-4" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold">Write New Post</h1>
                    <p className="text-sm text-muted-foreground">Create a new blog post or announcement.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <input
                            required
                            name="title"
                            value={formData.title}
                            onChange={(e) => {
                                handleChange(e);
                                // Auto-slug on first type if slug is empty
                                if (!formData.slug && e.target.value.length > 3) {
                                    handleGenerateSlug();
                                }
                            }}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="e.g. Announcing DeepPivot AI v2"
                        />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex justify-between">
                            <span>URL Slug *</span>
                            <button type="button" onClick={handleGenerateSlug} className="text-xs text-primary hover:underline">Auto-generate</button>
                        </label>
                        <input
                            required
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            pattern="^[a-z0-9-]+$"
                            title="Only lowercase letters, numbers, and hyphens"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="e.g. announcing-deeppivot-v2"
                        />
                    </div>

                    {/* Author */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Author Name</label>
                        <input
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="DeepPivot Team"
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tags (comma separated)</label>
                        <input
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="e.g. updates, feature, ai"
                        />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Short Excerpt</label>
                        <textarea
                            name="excerpt"
                            value={formData.excerpt}
                            onChange={handleChange}
                            rows={2}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                            placeholder="A brief summary for the blog listing page..."
                        />
                    </div>

                    {/* Content Section */}
                    <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Post Content (Markdown) *</label>
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                                <Info className="size-3.5 text-primary" />
                                Supports full MDX styling
                            </span>
                        </div>
                        <textarea
                            required
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={15}
                            className="w-full rounded-lg border bg-card px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                            placeholder="## Headings, **bold text**, and links are supported here..."
                        />
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t">
                    <Link
                        href="/admin/blog"
                        className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {isSaving ? "Saving..." : "Publish Post"}
                    </button>
                </div>
            </form>
        </div>
    );
}
