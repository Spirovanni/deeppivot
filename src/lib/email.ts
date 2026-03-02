import { Resend } from "resend";
import { createElement, type ReactElement } from "react";
import { render } from "@react-email/render";
import {
    InterviewFeedbackReadyEmail,
    type InterviewFeedbackReadyEmailProps,
} from "@/emails/InterviewFeedbackReadyEmail";
import {
    NewApplicantEmail,
    type NewApplicantEmailProps,
} from "@/emails/NewApplicantEmail";
import {
    MentorConnectionEmail,
    type MentorConnectionEmailProps,
} from "@/emails/MentorConnectionEmail";
import {
    EmployerInvitedYouToApplyEmail,
    type EmployerInvitedYouToApplyEmailProps,
} from "@/emails/EmployerInvitedYouToApplyEmail";
import {
    AnnouncementEmail,
} from "@/emails/AnnouncementEmail";

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

export async function sendInterviewFeedbackEmail(
    to: string,
    data: InterviewFeedbackReadyEmailProps,
): Promise<{ success: boolean; error?: string }> {
    return sendEmail({
        to,
        subject: "Your interview feedback is ready!",
        react: createElement(InterviewFeedbackReadyEmail, data),
    });
}

export async function sendNewApplicantEmail(
    to: string,
    data: NewApplicantEmailProps,
): Promise<{ success: boolean; error?: string }> {
    return sendEmail({
        to,
        subject: `New applicant for ${data.jobTitle}`,
        react: createElement(NewApplicantEmail, data),
    });
}

export async function sendEmployerInviteEmail(
    to: string,
    data: EmployerInvitedYouToApplyEmailProps,
): Promise<{ success: boolean; error?: string }> {
    return sendEmail({
        to,
        subject: `${data.employerName} at ${data.companyName} invited you to apply for ${data.jobTitle}`,
        react: createElement(EmployerInvitedYouToApplyEmail, data),
    });
}

export async function sendMentorConnectionEmail(
    to: string,
    data: MentorConnectionEmailProps,
): Promise<{ success: boolean; error?: string }> {
    const isRequest = data.type === "request";
    const subject = isRequest
        ? `New mentorship request from ${data.learnerName}`
        : `${data.mentorName} accepted your mentorship request!`;

    return sendEmail({
        to,
        subject,
        react: createElement(MentorConnectionEmail, data),
    });
}

export async function sendAnnouncementEmail(
    to: string,
    data: { userName: string; title: string; body: string; link: string },
): Promise<{ success: boolean; error?: string }> {
    return sendEmail({
        to,
        subject: `Announcement: ${data.title}`,
        react: createElement(AnnouncementEmail, data),
    });
}

/**
 * Sends a batch of emails using Resend's batch API.
 * Maximum 100 emails per batch.
 */
export async function sendBatchEmails(
    emails: Array<{
        to: string;
        subject: string;
        react: ReactElement;
    }>
): Promise<{ success: boolean; results?: any; error?: string }> {
    const resend = getResend();
    if (!resend) {
        console.warn("[email] RESEND_API_KEY not set — skipping batch send");
        return { success: false, error: "Email service not configured" };
    }

    try {
        const batchData = await Promise.all(
            emails.map(async (e) => ({
                from: FROM_ADDRESS,
                to: e.to,
                subject: e.subject,
                html: await render(e.react),
            }))
        );

        const { data, error } = await resend.batch.send(batchData);
        if (error) throw new Error(error.message);
        return { success: true, results: data };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("[email] Batch send failed –", msg);
        return { success: false, error: msg };
    }
}
