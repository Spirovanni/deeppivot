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

export interface EmployerInvitedYouToApplyEmailProps {
    candidateName?: string;
    employerName: string;
    companyName: string;
    jobTitle: string;
    jobId: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://deeppivot.com";

export function EmployerInvitedYouToApplyEmail({
    candidateName = "there",
    employerName,
    companyName,
    jobTitle,
    jobId,
}: EmployerInvitedYouToApplyEmailProps) {
    const applyUrl = `${BASE_URL}/jobs/${jobId}`;

    return (
        <Html>
            <Head />
            <Preview>{employerName} at {companyName} invited you to apply for {jobTitle}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logo}>&#10022; DeepPivot</Heading>
                    </Section>

                    <Section style={heroSection}>
                        <Heading style={h1}>You&apos;re Invited to Apply</Heading>
                        <Text style={paragraph}>
                            Hi {candidateName}, <strong>{employerName}</strong> at{" "}
                            <strong>{companyName}</strong> has invited you to apply for the role of{" "}
                            <strong>{jobTitle}</strong>.
                        </Text>
                    </Section>

                    <Section style={ctaSection}>
                        <Button href={applyUrl} style={primaryButton}>
                            View Job &amp; Apply
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Section style={footerSection}>
                        <Text style={footerText}>
                            <Link href={`${BASE_URL}/jobs`} style={link}>Browse Jobs</Link>
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

export default EmployerInvitedYouToApplyEmail;

// Styles (match NewApplicantEmail dark theme)
const main = { backgroundColor: "#0a0a0f", fontFamily: "'Inter', 'Helvetica Neue', sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 16px" };
const header = { paddingTop: "32px", paddingBottom: "8px" };
const logo = { fontSize: "20px", fontWeight: "700" as const, color: "#a78bfa", margin: "0" };
const heroSection = { padding: "24px 0 16px" };
const h1 = { fontSize: "24px", fontWeight: "700" as const, color: "#ffffff", margin: "0 0 12px" };
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#a1a1aa", margin: "0 0 20px" };
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
