"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Eye, Edit3, CheckCircle2, Copy, FileDown, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { cn } from "@/utils";
import { useReactToPrint } from "react-to-print";

interface CoverLetterEditorProps {
    content: string;
    onChange: (content: string) => void;
    isGenerating: boolean;
    coverLetterId: number | null;
}

export function CoverLetterEditor({
    content,
    onChange,
    isGenerating: parentIsGenerating,
    coverLetterId
}: CoverLetterEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [iteratingIndex, setIteratingIndex] = useState<number | null>(null);
    const [iterationInstruction, setIterationInstruction] = useState("");
    const [isIterating, setIsIterating] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Cover Letter",
    });

    const handleSave = async () => {
        if (!coverLetterId) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/cover-letters/${coverLetterId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) throw new Error("Failed to save changes");

            setLastSaved(new Date());
            toast.success("Changes saved");
        } catch (error) {
            toast.error("Could not save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        toast.success("Copied to clipboard");
    };

    const handleIterate = async (index: number) => {
        setIsIterating(true);
        setIteratingIndex(index);

        try {
            const response = await fetch("/api/cover-letters/iterate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullContent: content,
                    paragraphIndex: index,
                    instructions: iterationInstruction,
                }),
            });

            if (!response.ok) throw new Error("Failed to iterate");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let newParagraph = "";

            if (!reader) throw new Error("Failed to start stream");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                newParagraph += chunk;

                // Update the specific paragraph in the full content
                const paragraphs = content.split("\n");
                paragraphs[index] = newParagraph;
                onChange(paragraphs.join("\n"));
            }

            toast.success("Paragraph updated!");
            setIteratingIndex(null);
            setIterationInstruction("");
        } catch (error) {
            toast.error("Iteration failed");
        } finally {
            setIsIterating(false);
        }
    };

    // Simple Markdown-ish renderer for "Preview"
    const renderPreview = (text: string) => {
        if (!text) return <p className="text-muted-foreground italic">Generating content...</p>;

        const paragraphs = text.split("\n");

        return paragraphs.map((line, i) => {
            if (line.startsWith("# ")) {
                return (
                    <h1 key={i} className="mb-4 mt-6 text-2xl font-bold border-b pb-2">
                        {line.substring(2)}
                    </h1>
                );
            }
            if (line.startsWith("## ")) {
                return (
                    <h2 key={i} className="mb-3 mt-5 text-xl font-bold">
                        {line.substring(3)}
                    </h2>
                );
            }
            if (line.startsWith("- ") || line.startsWith("* ")) {
                return (
                    <li key={i} className="ml-4 mb-1 list-disc">
                        {line.substring(2)}
                    </li>
                );
            }
            if (line.trim() === "") {
                return <div key={i} className="h-4" />;
            }

            const isTarget = iteratingIndex === i;

            return (
                <div key={i} className="group relative mb-2">
                    <p className={cn("leading-relaxed", isTarget && "bg-primary/5 rounded px-1 transition-colors")}>
                        {line}
                    </p>

                    {!parentIsGenerating && !isIterating && (
                        <div className="absolute -right-4 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 pl-4 translate-x-full bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm z-10">
                            {iteratingIndex === null ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-[11px] flex items-center gap-1"
                                    onClick={() => setIteratingIndex(i)}
                                >
                                    <Sparkles className="size-3" />
                                    Iterate
                                </Button>
                            ) : isTarget ? (
                                <div className="flex flex-col gap-2 p-2 min-w-[200px]">
                                    <Input
                                        placeholder="E.g. Make it more punchy..."
                                        value={iterationInstruction}
                                        onChange={(e) => setIterationInstruction(e.target.value)}
                                        className="h-8 text-xs"
                                        onKeyDown={(e) => e.key === 'Enter' && handleIterate(i)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[11px]"
                                            onClick={() => setIteratingIndex(null)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="h-7 px-2 text-[11px]"
                                            onClick={() => handleIterate(i)}
                                        >
                                            Regenerate
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {isTarget && isIterating && (
                        <div className="absolute -right-4 top-0 translate-x-full pl-4">
                            <Button disabled variant="ghost" size="sm" className="h-7 px-2">
                                <Loader2 className="size-3 animate-spin mr-1" />
                                <span className="text-[11px]">Iterating...</span>
                            </Button>
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <Card className="flex flex-col h-full min-h-[500px]">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
                <div>
                    <CardTitle className="text-lg">Generated Cover Letter</CardTitle>
                    {lastSaved && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-green-500" />
                            Last saved {lastSaved.toLocaleTimeString()}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="size-4 mr-2" />
                        Copy
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint()}
                        disabled={!content || parentIsGenerating || isIterating}
                    >
                        <FileDown className="size-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !coverLetterId || parentIsGenerating || isIterating}
                    >
                        <Save className="size-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <Tabs defaultValue="edit" className="flex flex-col h-full">
                    <div className="border-b px-4 py-1 bg-muted/20">
                        <TabsList className="bg-transparent border-0 h-8">
                            <TabsTrigger value="edit" className="data-[state=active]:bg-background">
                                <Edit3 className="size-3.5 mr-1.5" />
                                Edit
                            </TabsTrigger>
                            <TabsTrigger value="preview" className="data-[state=active]:bg-background">
                                <Eye className="size-3.5 mr-1.5" />
                                Preview
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="edit" className="flex-1 mt-0 p-0 border-0 focus-visible:ring-0">
                        <Textarea
                            className="min-h-[400px] h-full w-full p-6 resize-none border-0 focus-visible:ring-0 rounded-none bg-background font-mono text-sm"
                            value={content}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Your cover letter content will appear here..."
                            disabled={parentIsGenerating || isIterating}
                        />
                    </TabsContent>
                    <TabsContent value="preview" className="flex-1 mt-0 p-0 overflow-auto">
                        <div
                            className="p-8 prose prose-slate dark:prose-invert max-w-none bg-white text-slate-900 min-h-full"
                            ref={printRef}
                        >
                            <style type="text/css" media="print">
                                {`
                  @page { size: auto; margin: 20mm; }
                  body { color: black !important; background: white !important; }
                  .prose { max-width: none !important; }
                `}
                            </style>
                            {renderPreview(content)}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
