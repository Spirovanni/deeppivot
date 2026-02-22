"use client";

import { cn } from "@/utils";
import { motion } from "framer-motion";
import { AutoSizer } from "react-virtualized";

// Cast to work around @types/react-virtualized incompatibility with React 18 JSX types
const SafeAutoSizer = AutoSizer as unknown as React.FC<{
  children: (size: { width: number; height: number }) => React.ReactNode;
}>;

export default function MicFFT({
  fft,
  className,
}: {
  fft: number[];
  className?: string;
}) {
  return (
    <div className={"relative size-full"}>
      <SafeAutoSizer>
        {({ width, height }) => (
          <motion.svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            className={cn("absolute !inset-0 !size-full", className)}
          >
            {Array.from({ length: 24 }).map((_, index) => {
              const value = (fft[index] ?? 0) / 4;
              const h = Math.min(Math.max(height * value, 2), height);
              const yOffset = height * 0.5 - h * 0.5;

              return (
                <motion.rect
                  key={`mic-fft-${index}`}
                  height={h}
                  width={2}
                  x={2 + (index * width - 4) / 24}
                  y={yOffset}
                  rx={4}
                />
              );
            })}
          </motion.svg>
        )}
      </SafeAutoSizer>
    </div>
  );
}
