import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Mail, MessageSquare, Clock } from "lucide-react";

export const metadata: Metadata = {
    title: "Contact Us | DeepPivot",
    description: "Get in touch with the DeepPivot team. We're here to help with questions about your account, features, or partnerships.",
};

const INFO_CARDS = [
    {
        icon: Mail,
        title: "Email Support",
        description: "hello@deeppivot.com",
        sub: "For general inquiries",
    },
    {
        icon: MessageSquare,
        title: "Partnership & Enterprise",
        description: "partners@deeppivot.com",
        sub: "Workforce development & B2B",
    },
    {
        icon: Clock,
        title: "Response Time",
        description: "1–2 business days",
        sub: "Mon–Fri, 9am–6pm PT",
    },
];

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-3">Contact Us</h1>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Have a question, feedback, or interested in a partnership? We&apos;d love to hear from you.
                    </p>
                </div>

                {/* Info cards */}
                <div className="grid gap-4 sm:grid-cols-3 mb-12">
                    {INFO_CARDS.map((card) => (
                        <div key={card.title} className="rounded-xl border bg-card p-5 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <card.icon className="size-5 text-primary" />
                                </div>
                            </div>
                            <p className="font-semibold text-sm">{card.title}</p>
                            <p className="text-sm mt-1">{card.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="rounded-xl border bg-card p-6 sm:p-8 max-w-2xl mx-auto">
                    <h2 className="text-lg font-semibold mb-6">Send us a message</h2>
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}
