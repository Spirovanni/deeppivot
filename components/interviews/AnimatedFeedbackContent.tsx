"use client";

import { motion } from "framer-motion";
import { expressionColors, isExpressionColor } from "@/utils/expressionColors";

function normalizeEmotionKey(emotion: string): string {
  return emotion.charAt(0).toLowerCase() + emotion.slice(1);
}

function getEmotionColor(emotion: string): string {
  const key = normalizeEmotionKey(emotion);
  return isExpressionColor(key) ? expressionColors[key as keyof typeof expressionColors] : "#879aa1";
}

interface AnimatedFeedbackContentProps {
  content: string;
  /** Optional: dominant emotion for color accent on "Emotional Tone" section */
  dominantEmotion?: string;
}

/**
 * Renders markdown-like feedback with staggered animations and optional emotion color cues.
 */
export function AnimatedFeedbackContent({
  content,
  dominantEmotion,
}: AnimatedFeedbackContentProps) {
  const sections = content.split(/(?=^## )/m).filter(Boolean);

  if (sections.length === 0) {
    return (
      <div className="whitespace-pre-wrap text-sm text-muted-foreground">
        {content}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section, i) => {
        const [firstLine, ...rest] = section.trim().split("\n");
        const title = firstLine?.replace(/^##\s*/, "").trim() ?? "";
        const body = rest.join("\n").trim();
        const isEmotionalTone = /emotional\s*tone/i.test(title);
        const accentColor =
          isEmotionalTone && dominantEmotion
            ? getEmotionColor(dominantEmotion)
            : undefined;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08, ease: "easeOut" }}
            className={
              accentColor
                ? "rounded-lg border-l-4 py-1 pl-4"
                : ""
            }
            style={
              accentColor
                ? { borderLeftColor: accentColor }
                : undefined
            }
          >
            <h3 className="mb-2 text-base font-semibold">{title}</h3>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {body.split("\n").map((line, j) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                const isBullet = /^[-*]\s/.test(trimmed);
                const text = isBullet ? trimmed.replace(/^[-*]\s+/, "") : trimmed;
                return (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: i * 0.08 + j * 0.03,
                      ease: "easeOut",
                    }}
                    className={isBullet ? "flex gap-2" : ""}
                  >
                    {isBullet && (
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: accentColor ?? "hsl(var(--primary))",
                          opacity: 0.8,
                        }}
                      />
                    )}
                    <span>{text}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
