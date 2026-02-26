import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { rating, message } = body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Log submission — can be wired to Canny, Linear, Slack webhook, etc.
    console.log("[feedback]", {
        rating: numRating,
        message: message?.slice(0, 500) ?? "",
        timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
}
