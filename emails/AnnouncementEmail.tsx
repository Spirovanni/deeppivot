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

interface AnnouncementEmailProps {
    userName?: string;
    title: string;
    body: string;
    link: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://deeppivot.com";

export function AnnouncementEmail({ userName = "there", title, body, link }: AnnouncementEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>New Announcement: {title}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={logo}>✦ DeepPivot</Heading>
                    </Section>

                    {/* Content */}
                    <Section style={contentSection}>
                        <Text style={greeting}>Hi {userName},</Text>
                        <Heading style={h1}>{title}</Heading>
                        <div
                            style={richText}
                            dangerouslySetInnerHTML={{ __html: body }}
                        />
                    </Section>

                    {/* CTA */}
                    <Section style={ctaSection}>
                        <Button href={`${BASE_URL}${link}`} style={primaryButton}>
                            Read Full Announcement →
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    {/* Footer */}
                    <Section style={footerSection}>
                        <Text style={footerText}>
                            © {new Date().getFullYear()} DeepPivot. All rights reserved.
                        </Text>
                        <Text style={footerText}>
                            You&apos;re receiving this as a registered user of DeepPivot.
                            If you no longer wish to receive these emails, you can
                            <Link href={`${BASE_URL}/dashboard/settings`} style={footerLink}> update your preferences</Link>.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

export default AnnouncementEmail;

// ── Styles ────────────────────────────────────────────────────────────────────
const main = { backgroundColor: "#0a0a0f", fontFamily: "'Inter', 'Helvetica Neue', sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 16px" };
const header = { paddingTop: "32px", paddingBottom: "16px" };
const logo = { fontSize: "20px", fontWeight: "700", color: "#a78bfa", margin: "0" };
const contentSection = { padding: "24px 0 16px" };
const greeting = { fontSize: "14px", color: "#a1a1aa", margin: "0 0 12px" };
const h1 = { fontSize: "24px", fontWeight: "800", color: "#ffffff", margin: "0 0 20px", lineHeight: "1.3" };
const richText = { fontSize: "15px", lineHeight: "1.6", color: "#e4e4e7" };
const ctaSection = { padding: "12px 0 32px" };
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
const divider = { borderColor: "#27272a", margin: "8px 0 24px" };
const footerSection = { padding: "0 0 40px" };
const footerText = { fontSize: "11px", color: "#52525b", textAlign: "center" as const, margin: "4px 0" };
const footerLink = { color: "#71717a", textDecoration: "underline" };
