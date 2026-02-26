import {
    Body,
    Button,
    Column,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Row,
    Section,
    Text,
} from "@react-email/components";

interface WelcomeEmailProps {
    userName?: string;
    userEmail?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://deeppivot.com";

export function WelcomeEmail({ userName = "there", userEmail }: WelcomeEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Welcome to DeepPivot — your AI-powered career coach is ready 🎉</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={logo}>✦ DeepPivot</Heading>
                    </Section>

                    {/* Hero */}
                    <Section style={heroSection}>
                        <Heading style={h1}>Welcome, {userName}! 🎉</Heading>
                        <Text style={paragraph}>
                            You&apos;re now part of DeepPivot — where AI meets career development. Whether you&apos;re
                            preparing for your next job interview, discovering your career archetype, or tracking
                            opportunities, we&apos;ve got you covered.
                        </Text>
                    </Section>

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Button href={`${BASE_URL}/dashboard/interviews`} style={primaryButton}>
                            Start Your First Interview →
                        </Button>
                    </Section>

                    {/* Features */}
                    <Section style={featureSection}>
                        <Heading style={h2}>What you can do right now</Heading>
                        <Row>
                            <Column style={featureCol}>
                                <Text style={featureIcon}>🎙️</Text>
                                <Text style={featureTitle}>AI Voice Interviews</Text>
                                <Text style={featureText}>
                                    Practice with Sarah, your real-time voice coach. Get scored on clarity, confidence, and adaptability.
                                </Text>
                            </Column>
                            <Column style={featureCol}>
                                <Text style={featureIcon}>🧭</Text>
                                <Text style={featureTitle}>Career Archetype</Text>
                                <Text style={featureText}>
                                    Discover your professional strengths and the roles where you&apos;ll thrive most.
                                </Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column style={featureCol}>
                                <Text style={featureIcon}>📋</Text>
                                <Text style={featureTitle}>Job Tracker</Text>
                                <Text style={featureText}>
                                    Manage all your applications in a visual Kanban board — never lose track of an opportunity.
                                </Text>
                            </Column>
                            <Column style={featureCol}>
                                <Text style={featureIcon}>🎯</Text>
                                <Text style={featureTitle}>Career Plan</Text>
                                <Text style={featureText}>
                                    Build a milestone roadmap with resources and track your progress toward your next role.
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    {/* Secondary links */}
                    <Section style={linksSection}>
                        <Text style={linksText}>
                            <Link href={`${BASE_URL}/faq`} style={link}>FAQ</Link>
                            {" · "}
                            <Link href={`${BASE_URL}/blog`} style={link}>Blog</Link>
                            {" · "}
                            <Link href={`${BASE_URL}/contact`} style={link}>Contact Support</Link>
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footerSection}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} DeepPivot. All rights reserved.
                        </Text>
                        {userEmail && (
                            <Text style={footerText}>
                                You&apos;re receiving this because you signed up with {userEmail}.
                            </Text>
                        )}
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default WelcomeEmail;

// ── Styles ────────────────────────────────────────────────────────────────────
const main = { backgroundColor: "#0a0a0f", fontFamily: "'Inter', 'Helvetica Neue', sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 16px" };
const header = { paddingTop: "32px", paddingBottom: "8px" };
const logo = { fontSize: "20px", fontWeight: "700", color: "#a78bfa", margin: "0" };
const heroSection = { padding: "24px 0 16px" };
const h1 = { fontSize: "26px", fontWeight: "700", color: "#ffffff", margin: "0 0 12px" };
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#a1a1aa", margin: "0 0 20px" };
const ctaSection = { padding: "4px 0 24px" };
const primaryButton = {
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    padding: "13px 28px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    textDecoration: "none",
    display: "inline-block",
};
const featureSection = { padding: "16px 0 8px" };
const h2 = { fontSize: "16px", fontWeight: "600", color: "#ffffff", margin: "0 0 16px" };
const featureCol = { width: "50%", paddingRight: "12px", verticalAlign: "top" as const };
const featureIcon = { fontSize: "22px", margin: "0 0 4px" };
const featureTitle = { fontSize: "13px", fontWeight: "600", color: "#e4e4e7", margin: "0 0 4px" };
const featureText = { fontSize: "12px", lineHeight: "1.5", color: "#71717a", margin: "0 0 16px" };
const divider = { borderColor: "#27272a", margin: "8px 0 16px" };
const linksSection = { textAlign: "center" as const, padding: "4px 0" };
const linksText = { fontSize: "12px", color: "#71717a", margin: "0" };
const link = { color: "#a78bfa", textDecoration: "underline" };
const footerSection = { padding: "16px 0 32px" };
const footerText = { fontSize: "11px", color: "#52525b", textAlign: "center" as const, margin: "2px 0" };
