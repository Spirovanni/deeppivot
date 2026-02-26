import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

interface Props {
    params: Promise<{ slug: string }>;
}

function getPost(slug: string) {
    const filePath = path.join(process.cwd(), "content", "blog", `${slug}.mdx`);
    const mdPath = path.join(process.cwd(), "content", "blog", `${slug}.md`);
    const fp = fs.existsSync(filePath) ? filePath : fs.existsSync(mdPath) ? mdPath : null;
    if (!fp) return null;

    const raw = fs.readFileSync(fp, "utf8");
    const { data, content } = matter(raw);
    return { data, content };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = getPost(slug);
    if (!post) return { title: "Post Not Found | DeepPivot" };
    return {
        title: `${post.data.title} | DeepPivot Blog`,
        description: post.data.excerpt ?? "",
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = getPost(slug);
    if (!post) notFound();

    const { data, content } = post;

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                {/* Back */}
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Back to Blog
                </Link>

                {/* Header */}
                <header className="mb-10">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {(data.tags ?? []).map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-4">{data.title}</h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <CalendarDays className="size-3.5" />
                            {new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                        {data.author && (
                            <>
                                <span>·</span>
                                <span>{data.author}</span>
                            </>
                        )}
                    </div>
                </header>

                {/* MDX Content */}
                <article className="prose prose-invert max-w-none text-sm leading-relaxed prose-headings:font-semibold prose-a:text-primary prose-strong:text-foreground">
                    <MDXRemote source={content} />
                </article>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t">
                    <p className="text-sm text-muted-foreground">
                        Have feedback on this post?{" "}
                        <Link href="/contact" className="text-primary underline">Let us know.</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
