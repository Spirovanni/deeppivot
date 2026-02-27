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

export interface NewApplicantEmailProps {
    employerName?: string;
    jobTitle: string;
    applicantName: string;
    archetypeName?: string | null;
    avgInterviewScore?: number | null;
    jobId: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://deeppivot.com";

export function NewApplicantEmail({
    employerName = "there",
    jobTitle,
    applicantName,
    archetypeName,
    avgInterviewScore,
    jobId,
}: NewApplicantEmailProps) {
    const reviewUrl = `${BASE_URL}/employer/jobs/${jobId}/applications`;

    return (
        <Html>
            <Head />
            <Preview>New applicant for {jobTitle} — {applicantName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={logo}>&#10022; DeepPivot</Heading>
                    </Section>

                    {/* Hero */}
                    <Section style={heroSection}>
                        <Heading style={h1}>New Application Received</Heading>
                        <Text style={paragraph}>
                            Hi {employerName}, <strong>{applicantName}</strong> just applied
                            for <strong>{jobTitle}</strong>.
                        </Text>
                    </Section>

                    {/* Applicant details */}
                    <Section style={detailsSection}>
                        {archetypeName && (
                            <Text style={detailRow}>
                                <span style={detailLabel}>Career Archetype:</span>{" "}
                                <span style={badgeStyle}>{archetypeName}</span>
                            </Text>
                        )}
                        {avgInterviewScore !== null && avgInterviewScore !== undefined && (
                            <Text style={detailRow}>
                                <span style={detailLabel}>Avg Interview Score:</span>{" "}
                                <strong style={{ color: "#ffffff" }}>{avgInterviewScore}%</strong>
                            </Text>
                        )}
                    </Section>

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Button href={reviewUrl} style={primaryButton}>
                            Review Applicant
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footerSection}>
                        <Text style={footerText}>
                            <Link href={`${BASE_URL}/employer/jobs`} style={link}>My Jobs</Link>
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

export default NewApplicantEmail;

// -- Styles -------------------------------------------------------------------
const main = { backgroundColor: "#0a0a0f", fontFamily: "'Inter', 'Helvetica Neue', sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 16px" };
const header = { paddingTop: "32px", paddingBottom: "8px" };
const logo = { fontSize: "20px", fontWeight: "700" as const, color: "#a78bfa", margin: "0" };
const heroSection = { padding: "24px 0 16px" };
const h1 = { fontSize: "24px", fontWeight: "700" as const, color: "#ffffff", margin: "0 0 12px" };
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#a1a1aa", margin: "0 0 20px" };
const detailsSection = { padding: "0 0 16px" };
const detailRow = { fontSize: "14px", lineHeight: "1.5", color: "#a1a1aa", margin: "0 0 6px" };
const detailLabel = { color: "#71717a", fontSize: "12px", textTransform: "uppercase" as const, letterSpacing: "0.05em" };
const badgeStyle = {
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "600" as const,
};
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
