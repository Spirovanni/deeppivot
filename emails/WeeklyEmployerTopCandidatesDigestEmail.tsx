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

export type EmployerDigestCandidate = {
    name: string;
    matchScore: number;
    archetypeName: string | null;
    avgInterviewScore: number | null;
};

export type EmployerDigestJob = {
    jobId: number;
    title: string;
    candidates: EmployerDigestCandidate[];
};

export interface WeeklyEmployerTopCandidatesDigestEmailProps {
    employerName?: string;
    jobs: EmployerDigestJob[];
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://deeppivot.com";

export function WeeklyEmployerTopCandidatesDigestEmail({
    employerName = "there",
    jobs,
}: WeeklyEmployerTopCandidatesDigestEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Your weekly top candidate matches digest is ready</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logo}>&#10022; DeepPivot</Heading>
                    </Section>

                    <Section style={heroSection}>
                        <Heading style={h1}>Weekly Top Candidates</Heading>
                        <Text style={paragraph}>
                            Hi {employerName}, here are your best candidate matches across active jobs this week.
                        </Text>
                    </Section>

                    {jobs.map((job) => (
                        <Section key={job.jobId} style={jobCard}>
                            <Text style={jobTitle}>{job.title}</Text>
                            {job.candidates.map((candidate, idx) => (
                                <Text key={`${job.jobId}-${idx}`} style={candidateRow}>
                                    <strong style={{ color: "#ffffff" }}>{candidate.name}</strong>
                                    {" · "}
                                    <span style={scoreBadge}>{candidate.matchScore}% match</span>
                                    {candidate.archetypeName ? ` · ${candidate.archetypeName}` : ""}
                                    {candidate.avgInterviewScore != null
                                        ? ` · Interview ${candidate.avgInterviewScore}%`
                                        : ""}
                                </Text>
                            ))}
                            <Button href={`${BASE_URL}/employer/jobs/${job.jobId}/applications`} style={secondaryButton}>
                                Review Matches
                            </Button>
                        </Section>
                    ))}

                    <Section style={ctaSection}>
                        <Button href={`${BASE_URL}/employer/jobs`} style={primaryButton}>
                            Manage Jobs
                        </Button>
                    </Section>

                    <Hr style={divider} />

                    <Section style={footerSection}>
                        <Text style={footerText}>
                            <Link href={`${BASE_URL}/employer/jobs`} style={link}>Job Dashboard</Link>
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

export default WeeklyEmployerTopCandidatesDigestEmail;

const main = { backgroundColor: "#0a0a0f", fontFamily: "'Inter', 'Helvetica Neue', sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 16px" };
const header = { paddingTop: "32px", paddingBottom: "8px" };
const logo = { fontSize: "20px", fontWeight: "700" as const, color: "#a78bfa", margin: "0" };
const heroSection = { padding: "24px 0 12px" };
const h1 = { fontSize: "24px", fontWeight: "700" as const, color: "#ffffff", margin: "0 0 12px" };
const paragraph = { fontSize: "15px", lineHeight: "1.6", color: "#a1a1aa", margin: "0 0 12px" };
const jobCard = {
    border: "1px solid #27272a",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "10px",
    backgroundColor: "#111115",
};
const jobTitle = { fontSize: "14px", color: "#ffffff", margin: "0 0 8px", fontWeight: "700" as const };
const candidateRow = { fontSize: "12px", lineHeight: "1.5", color: "#a1a1aa", margin: "0 0 6px" };
const scoreBadge = {
    backgroundColor: "#312e81",
    color: "#c7d2fe",
    borderRadius: "999px",
    padding: "2px 8px",
    fontSize: "11px",
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
const secondaryButton = {
    backgroundColor: "#27272a",
    color: "#e5e7eb",
    padding: "8px 14px",
    borderRadius: "6px",
    fontWeight: "600" as const,
    fontSize: "12px",
    textDecoration: "none",
    display: "inline-block" as const,
};
const divider = { borderColor: "#27272a", margin: "8px 0 16px" };
const footerSection = { padding: "8px 0 32px" };
const footerText = { fontSize: "11px", color: "#52525b", textAlign: "center" as const, margin: "2px 0" };
const link = { color: "#a78bfa", textDecoration: "underline" };
