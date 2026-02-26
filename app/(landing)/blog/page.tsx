import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";

export const metadata: Metadata = {
    title: "Blog | DeepPivot",
    description: "Career tips, product updates, and insights from the DeepPivot team.",
};

interface PostMeta {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    author: string;
    tags: string[];
}

function getAllPosts(): PostMeta[] {
    const postsDir = path.join(process.cwd(), "content", "blog");
    if (!fs.existsSync(postsDir)) return [];

    return fs
        .readdirSync(postsDir)
        .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
        .map((filename) => {
            const slug = filename.replace(/\.(mdx|md)$/, "");
            const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
            const { data } = matter(raw);
            return {
                slug,
                title: data.title ?? slug,
                date: data.date ?? "",
                excerpt: data.excerpt ?? "",
                author: data.author ?? "DeepPivot Team",
                tags: data.tags ?? [],
            };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Blog</h1>
                    <p className="text-muted-foreground">Career tips, product updates, and insights.</p>
                </div>

                {posts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No posts yet — check back soon!</p>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="block rounded-xl border bg-card p-6 hover:bg-muted/40 transition-colors"
                            >
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="size-3" />
                                        {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                    </span>
                                    <span>·</span>
                                    <span>{post.author}</span>
                                </div>
                                <h2 className="text-lg font-semibold mb-2 group-hover:text-primary">{post.title}</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                                {post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-4 overflow-hidden">
                                        {post.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary truncate max-w-[120px]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
