"use client";

import { MessageSquare, User, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/src/lib/utils";

interface Message {
    role: string;
    text: string;
}

interface TranscriptViewProps {
    messages: Message[];
}

export function TranscriptView({ messages }: TranscriptViewProps) {
    if (messages.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
                    <MessageSquare className="size-8 opacity-20" />
                    <p className="text-sm">No transcript available for this session.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <MessageSquare className="size-4 text-primary" />
                    Live Transcript
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Full conversation history between you and the AI interviewer.
                </p>
            </CardHeader>
            <CardContent className="px-0">
                <div className="space-y-6">
                    {messages.map((message, index) => {
                        const isUser = message.role === "user";
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex gap-4 group transition-all duration-200",
                                    isUser ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                {/* Avatar */}
                                <div
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors",
                                        isUser
                                            ? "bg-primary text-primary-foreground border-primary/20"
                                            : "bg-background text-muted-foreground border-border group-hover:bg-accent/50"
                                    )}
                                >
                                    {isUser ? (
                                        <User className="size-4" />
                                    ) : (
                                        <Bot className="size-4" />
                                    )}
                                </div>

                                {/* Bubble Container */}
                                <div
                                    className={cn(
                                        "flex max-w-[85%] flex-col gap-1.5",
                                        isUser ? "items-end" : "items-start"
                                    )}
                                >
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                                            {isUser ? "You" : "Interviewer"}
                                        </span>
                                    </div>
                                    <div
                                        className={cn(
                                            "relative rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ring-1 ring-inset",
                                            isUser
                                                ? "bg-primary/5 text-foreground ring-primary/20 rounded-tr-none"
                                                : "bg-accent/30 text-foreground ring-border rounded-tl-none"
                                        )}
                                    >
                                        {message.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
