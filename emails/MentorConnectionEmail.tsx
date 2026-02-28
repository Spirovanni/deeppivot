import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

export interface MentorConnectionEmailProps {
    type: "request" | "accepted";
    learnerName: string;
    mentorName: string;
    message?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deeppivot.com";

export const MentorConnectionEmail = ({
    type = "request",
    learnerName = "Alex Trailblazer",
    mentorName = "Sarah Chen",
    message = "I'm really interested in your background transitioning from engineering into product management. I'd love to get your advice.",
}: MentorConnectionEmailProps) => {
    const isRequest = type === "request";

    const previewText = isRequest
        ? `New mentorship request from ${learnerName}`
        : `${mentorName} accepted your mentorship request!`;

    const actionUrl = isRequest
        ? `${baseUrl}/dashboard/mentors` // Mentor viewing their requests
        : `${baseUrl}/dashboard/mentors`; // Learner viewing their connected mentor

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={heading}>
                        {isRequest ? "New Mentorship Request" : "Mentorship Request Accepted!"}
                    </Heading>

                    <Section style={section}>
                        {isRequest ? (
                            <>
                                <Text style={text}>Hi {mentorName},</Text>
                                <Text style={text}>
                                    <strong>{learnerName}</strong> would like to connect with you for mentorship on DeepPivot.
                                </Text>
                                {message && (
                                    <div style={messageBox}>
                                        <Text style={messageLabel}>Their message to you:</Text>
                                        <Text style={messageContent}>"{message}"</Text>
                                    </div>
                                )}
                                <Text style={text}>
                                    You can review their profile and accept or decline their request from your dashboard.
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={text}>Hi {learnerName},</Text>
                                <Text style={text}>
                                    Great news! <strong>{mentorName}</strong> has accepted your request to connect.
                                </Text>
                                <Text style={text}>
                                    They are now available in your mentor network. You can reach out to them, access resources they've shared, and share your interview sessions for feedback.
                                </Text>
                            </>
                        )}
                    </Section>

                    <Section style={buttonContainer}>
                        <Button style={button} href={actionUrl}>
                            {isRequest ? "Review Request" : "Go to Dashboard"}
                        </Button>
                    </Section>

                    <Hr style={hr} />

                    <Text style={footer}>
                        DeepPivot — AI-powered interview practice & career coaching.
                        <br />
                        If you didn't expect this email, you can safely ignore it.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    border: "1px solid #e6ebf1",
    borderRadius: "8px",
    maxWidth: "580px",
};

const heading = {
    fontSize: "24px",
    letterSpacing: "-0.5px",
    lineHeight: "1.3",
    fontWeight: "600",
    color: "#1f2937",
    padding: "0 24px",
};

const section = {
    padding: "0 24px",
};

const text = {
    margin: "16px 0",
    color: "#374151",
    fontSize: "16px",
    lineHeight: "24px",
};

const messageBox = {
    backgroundColor: "#f9fafb",
    borderLeft: "4px solid #6366f1",
    padding: "16px",
    margin: "24px 0",
    borderRadius: "0 8px 8px 0",
};

const messageLabel = {
    margin: "0 0 8px 0",
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "500",
};

const messageContent = {
    margin: "0",
    color: "#111827",
    fontSize: "16px",
    lineHeight: "24px",
    fontStyle: "italic",
};

const buttonContainer = {
    padding: "24px 24px",
    textAlign: "center" as const,
};

const button = {
    backgroundColor: "#6366f1",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "14px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box" as const,
};

const hr = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
};

const footer = {
    color: "#8898aa",
    fontSize: "12px",
    lineHeight: "16px",
    padding: "0 24px",
    textAlign: "center" as const,
};

export default MentorConnectionEmail;
