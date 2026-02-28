import { requireAdmin } from "@/src/lib/rbac";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { ClipboardCheck, Plus, CalendarDays } from "lucide-react";

export const metadata = {
    title: "Blog Manager | Admin",
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

export default async function AdminBlogPage() {
    await requireAdmin();
    const posts = getAllPosts();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="size-5 text-amber-400" />
                    <h1 className="text-xl font-bold">Blog Manager</h1>
                    <span className="text-sm text-muted-foreground">({posts.length} posts)</span>
                </div>
                <Link
                    href="/admin/blog/new"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="size-4" />
                    New Post
                </Link>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
                {posts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <p>No blog posts found.</p>
                        <p className="text-sm mt-1">Files created in content/blog will appear here.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Author</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-1/4">Tags</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((post) => (
                                <tr key={post.slug} className="border-b last:border-0 hover:bg-muted/10 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="font-medium truncate max-w-[300px]" title={post.title}>{post.title}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[300px] mt-0.5">/{post.slug}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{post.author}</td>
                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarDays className="size-3.5" />
                                            {post.date}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {post.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary truncate max-w-[80px]">
                                                    {tag}
                                                </span>
                                            ))}
                                            {post.tags.length > 3 && (
                                                <span className="text-[10px] text-muted-foreground">+{post.tags.length - 3} more</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            target="_blank"
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            View Live
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
