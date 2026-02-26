import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/src/lib/email";
import { createElement } from "react";

// Inline email template that avoids JSX (this is a .ts file not .tsx)
function buildContactEmailHtml(name: string, email: string, subject: string, message: string): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="background:#0a0a0f;font-family:sans-serif;color:#e4e4e7;padding:24px;margin:0">
  <div style="max-width:560px;margin:0 auto">
    <h2 style="color:#a78bfa;margin-bottom:16px">✦ New Contact Form Submission</h2>
    <p style="margin:4px 0"><strong>From:</strong> ${name} (${email})</p>
    <p style="margin:4px 0"><strong>Subject:</strong> ${subject}</p>
    <hr style="border-color:#27272a;margin:12px 0">
    <p style="white-space:pre-wrap;line-height:1.6;color:#a1a1aa">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
  </div>
</body></html>`;
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
        return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Send email directly using built HTML (gracefully skips if RESEND_API_KEY not set)
    const { Resend } = await import("resend");
    if (process.env.RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: "DeepPivot <hello@deeppivot.com>",
                to: "hello@deeppivot.com",
                replyTo: email,
                subject: `[Contact] ${subject} — from ${name}`,
                html: buildContactEmailHtml(name, email, subject, message),
            });
        } catch (err) {
            console.error("[contact] Failed to send email:", err);
        }
    }

    console.log("[contact-form]", { name, email, subject, timestamp: new Date().toISOString() });
    return NextResponse.json({ success: true });
}
