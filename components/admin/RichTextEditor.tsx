"use client";

import { useRef, useEffect, useState } from "react";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    RemoveFormatting,
    Type
} from "lucide-react";
import { cn } from "@/utils";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    disabled?: boolean;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Enter content...",
    className,
    minHeight = "200px",
    disabled = false,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Sync value from prop to editor (only if different to avoid cursor jumps)
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const execCommand = (command: string, value: string = "") => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const ToolbarButton = ({
        onClick,
        icon: Icon,
        label,
        active = false
    }: {
        onClick: () => void;
        icon: any;
        label: string;
        active?: boolean;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "p-2 rounded-md transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
                active ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
            title={label}
        >
            <Icon className="size-4" />
        </button>
    );

    return (
        <div className={cn(
            "rounded-lg border bg-background overflow-hidden transition-all",
            isFocused && !disabled ? "ring-1 ring-ring border-ring" : "border-input",
            disabled && "opacity-60 bg-muted/20",
            className
        )}>
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 border-b bg-muted/30 p-1">
                <ToolbarButton
                    onClick={() => execCommand("bold")}
                    icon={Bold}
                    label="Bold"
                />
                <ToolbarButton
                    onClick={() => execCommand("italic")}
                    icon={Italic}
                    label="Italic"
                />
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton
                    onClick={() => execCommand("formatBlock", "H1")}
                    icon={Heading1}
                    label="Heading 1"
                />
                <ToolbarButton
                    onClick={() => execCommand("formatBlock", "H2")}
                    icon={Heading2}
                    label="Heading 2"
                />
                <ToolbarButton
                    onClick={() => execCommand("formatBlock", "P")}
                    icon={Type}
                    label="Paragraph"
                />
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton
                    onClick={() => execCommand("insertUnorderedList")}
                    icon={List}
                    label="Bullet List"
                />
                <ToolbarButton
                    onClick={() => execCommand("insertOrderedList")}
                    icon={ListOrdered}
                    label="Numbered List"
                />
                <div className="flex-1" />
                <ToolbarButton
                    onClick={() => execCommand("removeFormat")}
                    icon={RemoveFormatting}
                    label="Clear Formatting"
                />
            </div>

            {/* Editor Area */}
            <div className="relative">
                {!value && !isFocused && (
                    <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none text-sm italic">
                        {placeholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    onInput={handleInput}
                    onFocus={() => !disabled && setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                        "w-full px-3 py-3 text-sm focus:outline-none overflow-y-auto rich-text-content",
                        disabled && "cursor-not-allowed"
                    )}
                    style={{ minHeight }}
                />
            </div>

            {/* Basic styles for the editor content */}
            <style jsx global>{`
        .rich-text-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.25;
        }
        .rich-text-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          line-height: 1.25;
        }
        .rich-text-content p {
          margin-bottom: 0.5rem;
        }
        .rich-text-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-content b, .rich-text-content strong {
          font-weight: 700;
        }
        .rich-text-content i, .rich-text-content em {
          font-style: italic;
        }
      `}</style>
        </div>
    );
}
