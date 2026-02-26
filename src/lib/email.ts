import { Resend } from "resend";
import { createElement, type ReactElement } from "react";
import { render } from "@react-email/render";

let _resend: Resend | null = null;

function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
    return _resend;
}

const FROM_ADDRESS = "DeepPivot <hello@deeppivot.com>";

export async function sendEmail({
    to,
    subject,
    react,
}: {
    to: string;
    subject: string;
    react: ReactElement;
}): Promise<{ success: boolean; error?: string }> {
    const resend = getResend();
    if (!resend) {
        console.warn("[email] RESEND_API_KEY not set — skipping email send to:", to);
        return { success: false, error: "Email service not configured" };
    }

    try {
        const html = await render(react);
        const { error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to,
            subject,
            html,
        });
        if (error) throw new Error(error.message);
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("[email] Failed to send email to", to, "–", msg);
        return { success: false, error: msg };
    }
}
