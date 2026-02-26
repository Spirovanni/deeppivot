import { inngest } from "@/src/inngest/client";
import { sendEmail } from "@/src/lib/email";
import { createElement } from "react";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

export const sendWelcomeEmail = inngest.createFunction(
    { id: "send-welcome-email", name: "Send Welcome Email" },
    { event: "user/created" },
    async ({ event }) => {
        const { userId, email, name } = event.data as {
            userId: string;
            email: string;
            name: string;
        };

        if (!email) {
            console.warn("[send-welcome-email] No email provided for user:", userId);
            return { skipped: true };
        }

        const result = await sendEmail({
            to: email,
            subject: "Welcome to DeepPivot! 🎉",
            react: createElement(WelcomeEmail, { userName: name?.split(" ")[0] || "there", userEmail: email }),
        });

        return result;
    }
);
