import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | DeepPivot",
    description: "Read the Terms of Service for DeepPivot, the AI-powered career development and interview practice platform.",
};

const LAST_UPDATED = "February 26, 2026";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
                <p className="text-sm text-muted-foreground mb-10">Last updated: {LAST_UPDATED}</p>

                <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using DeepPivot (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the Service. These Terms apply to all visitors, users, and others who access the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">2. Use of Service</h2>
                        <p>
                            DeepPivot grants you a limited, non-exclusive, non-transferable license to access and use the Service for your personal, non-commercial career development purposes. You agree not to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
                            <li>Reproduce, distribute, or create derivative works of Service content without written permission</li>
                            <li>Attempt to reverse-engineer or extract source code from the Service</li>
                            <li>Use automated tools to scrape or harvest data from the Service</li>
                            <li>Interfere with or disrupt the integrity or performance of the Service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">3. Accounts</h2>
                        <p>
                            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. DeepPivot shall not be liable for any loss or damage arising from your failure to protect your account information.
                        </p>
                        <p className="mt-2">
                            We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or cause harm to other users or the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">4. Intellectual Property</h2>
                        <p>
                            The Service and its original content, features, and functionality are and will remain the exclusive property of DeepPivot and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of DeepPivot.
                        </p>
                        <p className="mt-2">
                            Content you submit to the Service (such as interview responses and career information) remains yours. By submitting it, you grant DeepPivot a limited license to use it solely to provide and improve the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">5. AI-Generated Content</h2>
                        <p>
                            DeepPivot uses artificial intelligence to generate feedback, career assessments, and coaching content. This content is for informational purposes only and does not constitute professional career, legal, or financial advice. Results may vary and DeepPivot makes no guarantees about employment outcomes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">6. Disclaimers</h2>
                        <p>
                            The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without any warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
                        <p>
                            In no event shall DeepPivot, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">8. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in San Francisco County, California.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">9. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify or replace these Terms at any time. We will provide notice of significant changes by updating the &ldquo;Last updated&rdquo; date at the top of this page. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-foreground mb-2">10. Contact</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at{" "}
                            <a href="mailto:legal@deeppivot.com" className="text-primary underline">legal@deeppivot.com</a>{" "}
                            or visit our <a href="/contact" className="text-primary underline">Contact page</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
