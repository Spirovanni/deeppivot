import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { COVER_LETTER_REGENERATE_SYSTEM_PROMPT } from "@/src/lib/llm/prompts/regeneration";
import { rateLimitByUser } from "@/src/lib/rate-limit";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rl = await rateLimitByUser(req, userId, "COVER_LETTER_GENERATE");
        if (!rl.success) return rl.response;

        const { fullContent, paragraphIndex, instructions, tone } = await req.json();

        if (!fullContent || paragraphIndex === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: COVER_LETTER_REGENERATE_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `
FULL COVER LETTER:
${fullContent}

TARGET PARAGRAPH INDEX: ${paragraphIndex}
TONE: ${tone || "professional"}
INSTRUCTIONS: ${instructions || "Regenerate this paragraph to be more impactful while maintaining the original meaning."}
`
                },
            ],
            stream: true,
            temperature: 0.7,
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(new TextEncoder().encode(content));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Iteration API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
