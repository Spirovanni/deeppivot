import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";

export interface InterviewFeedbackReadyEmailProps {
    userName?: string;
    sessionType?: string;
    sessionDate?: string;
    overallScore?: number | null;
    strengths?: string[];
    sessionId: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://deeppivot.com";

function scoreColor(score: number): string {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#eab308";
    return "#f97316";
}

export function InterviewFeedbackReadyEmail({
    userName = "there",
    sessionType = "General",
    sessionDate,
    overallScore,
    strengths = [],
    sessionId,
}: InterviewFeedbackReadyEmailProps) {
    const feedbackUrl = `${BASE_URL}/dashboard/interviews/${sessionId}/feedback`;
    const formattedDate = sessionDate ?? new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    const displayType = sessionType.charAt(0).toUpperCase() + sessionType.slice(1);

    return (
        <Html>
            <Head />
            <Preview>Your interview feedback is ready — see how you did!</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={logo}>&#10022; DeepPivot</Heading>
                    </Section>

                    {/* Hero */}
                    <Section style={heroSection}>
                        <Heading style={h1}>Your feedback is ready!</Heading>
                        <Text style={paragraph}>
                            Hi {userName}, your <strong>{displayType}</strong> interview from{" "}
                            <strong>{formattedDate}</strong> has been reviewed by our AI coach.
                        </Text>
                    </Section>

                    {/* Score badge */}
                    {overallScore !== null && overallScore !== undefined && (
                        <Section style={scoreSection}>
                            <div style={{
                                ...scoreBadge,
                                borderColor: scoreColor(overallScore),
                            }}>
                                <Text style={{ ...scoreValue, color: scoreColor(overallScore) }}>
                                    {overallScore}%
                                </Text>
                                <Text style={scoreLabel}>Overall Score</Text>
                            </div>
                        </Section>
                    )}

                    {/* Strengths */}
                    {strengths.length > 0 && (
                        <Section style={strengthsSection}>
                            <Text style={strengthsHeading}>Key Strengths</Text>
                            {strengths.slice(0, 2).map((s, i) => (
                                <Text key={i} style={strengthItem}>&#10003; {s}</Text>
                            ))}
                        </Section>
                    )}

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Button href={feedbackUrl} style={primaryButton}>
                            View My Feedback
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footerSection}>
                        <Text style={footerText}>
                            <Link href={`${BASE_URL}/dashboard/interviews`} style={link}>All Interviews</Link>
                            {" · "}
                            <Link href={`${BASE_URL}/dashboard`} style={link}>Dashboard</Link>
                        </Text>
                        <Text style={footerText}>
                            &copy; {new Date().getFullYear()} DeepPivot. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default InterviewFeedbackReadyEmail;

// ── Styles ────────────────────────────────────────────────────────────────────
const main = { backgroundColor: "#0a0a0f", fontFamily: "'Inter', 'Helvetica Neue', sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 16px" };
const header = { paddingTop: "32px", paddingBottom: "8px" };
const logo = { fontSize: "20px", fontWeight: "700" as const, color: "#a78bfa", margin: "0" };
const heroSection = { padding: "24px 0 16px" };
const h1 = { fontSize: "24px", fontWeight: "700" as const, color: "#ffffff", margin: "0 0 12px" };
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#a1a1aa", margin: "0 0 20px" };
const scoreSection = { textAlign: "center" as const, padding: "8px 0 20px" };
const scoreBadge = {
    display: "inline-block" as const,
    border: "2px solid",
    borderRadius: "16px",
    padding: "16px 32px",
    textAlign: "center" as const,
};
const scoreValue = { fontSize: "36px", fontWeight: "700" as const, margin: "0", lineHeight: "1" };
const scoreLabel = { fontSize: "12px", color: "#71717a", margin: "4px 0 0", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
const strengthsSection = { padding: "0 0 16px" };
const strengthsHeading = { fontSize: "13px", fontWeight: "600" as const, color: "#e4e4e7", margin: "0 0 8px", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
const strengthItem = { fontSize: "14px", lineHeight: "1.5", color: "#a1a1aa", margin: "0 0 4px", paddingLeft: "4px" };
const ctaSection = { padding: "8px 0 24px", textAlign: "center" as const };
const primaryButton = {
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    padding: "13px 28px",
    borderRadius: "8px",
    fontWeight: "600" as const,
    fontSize: "14px",
    textDecoration: "none",
    display: "inline-block" as const,
};
const divider = { borderColor: "#27272a", margin: "8px 0 16px" };
const footerSection = { padding: "8px 0 32px" };
const footerText = { fontSize: "11px", color: "#52525b", textAlign: "center" as const, margin: "2px 0" };
const link = { color: "#a78bfa", textDecoration: "underline" };
