import { requireAdmin } from "@/src/lib/rbac";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { rateLimit } from "@/src/lib/rate-limit";

export async function POST(req: NextRequest) {
    const rl = await rateLimit(req, "ADMIN");
    if (!rl.success) return rl.response;

    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();
        const { title, slug, excerpt, author, content, tags } = data;

        if (!title || !slug || !content) {
            return NextResponse.json({ error: "Title, slug, and content are required." }, { status: 400 });
        }

        // Validate slug properly to prevent path traversal
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: "Slug can only contain lowercase letters, numbers, and hyphens." }, { status: 400 });
        }

        const date = new Date().toISOString().split("T")[0]; // Use today's date (YYYY-MM-DD)
        const parsedTags = Array.isArray(tags) ? tags : String(tags).split(",").map(t => t.trim()).filter(Boolean);

        const frontmatter = {
            title,
            date,
            excerpt: excerpt ?? "",
            author: author ?? "DeepPivot Team",
            tags: parsedTags,
        };

        // Construct the MDX file string using gray-matter
        const mdxContent = matter.stringify(content, frontmatter);

        // Define save path
        const postsDir = path.join(process.cwd(), "content", "blog");
        if (!fs.existsSync(postsDir)) {
            await fs.promises.mkdir(postsDir, { recursive: true });
        }

        const filePath = path.join(postsDir, `${slug}.mdx`);

        // Basic check to see if it already exists (we overwrite for simplicity in editing, or you could block it)
        await fs.promises.writeFile(filePath, mdxContent, "utf8");

        return NextResponse.json({ success: true, slug });

    } catch (error) {
        console.error("Failed to save blog post:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
