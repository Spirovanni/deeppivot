import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | DeepPivot",
    description: "Learn how DeepPivot collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "February 26, 2026";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground mb-10">Last updated: {LAST_UPDATED}</p>

                <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us, including:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>Account information</strong>: name, email address, profile photo (via Clerk authentication)</li>
                            <li><strong>Profile data</strong>: career history, skills, job preferences, pronouns, LinkedIn URL, phone number</li>
                            <li><strong>Interview content</strong>: audio recordings (processed in-session only), transcripts, and written feedback from AI coaching sessions</li>
                            <li><strong>Usage data</strong>: pages visited, features used, click patterns, session duration</li>
                            <li><strong>Payment information</strong>: handled exclusively by Polar; we do not store card numbers</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>To provide, operate, and improve the Service</li>
                            <li>To personalize your career coaching and archetype assessment</li>
                            <li>To process subscription payments and manage your account</li>
                            <li>To send transactional emails (account confirmations, receipts)</li>
                            <li>To detect and prevent fraud and abuse</li>
                            <li>To comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">3. Third-Party Services</h2>
                        <p>We use the following third-party services that may process your data:</p>
                        <div className="mt-2 space-y-2">
                            {[
                                { name: "Clerk", purpose: "Authentication and user management", link: "https://clerk.com/privacy" },
                                { name: "ElevenLabs", purpose: "Real-time AI voice interview processing", link: "https://elevenlabs.io/privacy" },
                                { name: "Neon (PostgreSQL)", purpose: "Database hosting", link: "https://neon.tech/privacy" },
                                { name: "Vercel", purpose: "Application hosting and CDN", link: "https://vercel.com/legal/privacy-policy" },
                                { name: "PostHog", purpose: "Product analytics (anonymized)", link: "https://posthog.com/privacy" },
                                { name: "Sentry", purpose: "Error monitoring", link: "https://sentry.io/privacy" },
                                { name: "Polar", purpose: "Subscription billing", link: "https://polar.sh/legal/privacy" },
                            ].map((s) => (
                                <div key={s.name} className="flex gap-2">
                                    <span className="font-medium text-foreground/90 min-w-[120px]">{s.name}</span>
                                    <span>{s.purpose} — <a href={s.link} className="text-primary underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Retention</h2>
                        <p>
                            We retain your account data for as long as your account is active. If you delete your account, we anonymize your data within 30 days. Interview recordings are not permanently stored — they are processed in real-time and transcripts are retained only to generate your feedback report. You may request deletion at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">5. Your Rights</h2>
                        <p>Depending on your location, you may have the following rights:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>Access</strong>: Request a copy of the personal data we hold about you</li>
                            <li><strong>Rectification</strong>: Correct inaccurate or incomplete data</li>
                            <li><strong>Erasure</strong>: Request deletion of your personal data (&ldquo;right to be forgotten&rdquo;)</li>
                            <li><strong>Portability</strong>: Receive your data in a machine-readable format</li>
                            <li><strong>Objection</strong>: Object to processing of your data for marketing purposes</li>
                            <li><strong>California residents</strong>: Rights under CCPA including opt-out of data sale (we do not sell data)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">6. Cookies</h2>
                        <p>
                            We use essential cookies for authentication session management (via Clerk) and optional analytics cookies (PostHog). You can disable non-essential cookies in your browser settings. We do not use advertising or tracking cookies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">7. Children&apos;s Privacy</h2>
                        <p>
                            The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child under 16 has provided us with personal information, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
                        <p>
                            For privacy-related requests or questions, contact our Data Protection team at{" "}
                            <a href="mailto:privacy@deeppivot.com" className="text-primary underline">privacy@deeppivot.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
