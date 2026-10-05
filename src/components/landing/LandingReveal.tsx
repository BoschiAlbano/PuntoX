"use client";

import { motion } from "framer-motion";

interface LandingRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  mode?: "mount" | "view";
}

export function LandingReveal({
  children,
  className,
  delay = 0,
  mode = "view",
}: LandingRevealProps) {
  const observesViewport =
    mode === "view" && typeof IntersectionObserver !== "undefined";
  const transition = {
    duration: 0.48,
    delay,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={observesViewport ? undefined : { opacity: 1, y: 0 }}
      whileInView={observesViewport ? { opacity: 1, y: 0 } : undefined}
      viewport={observesViewport ? { once: true, margin: "-48px" } : undefined}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
