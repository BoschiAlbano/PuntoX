"use client";

import { useEffect, useRef } from "react";

interface SigninEntranceProps {
  children: React.ReactNode;
  className?: string;
  variant: "brand" | "content";
}

export function SigninEntrance({
  children,
  className = "",
  variant,
}: SigninEntranceProps) {
  const entranceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = entranceRef.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const keyframes = prefersReducedMotion
      ? [{ opacity: 0 }, { opacity: 1 }]
      : variant === "brand"
        ? [
            { opacity: 0, transform: "translate3d(-20px, 0, 0)" },
            { opacity: 1, transform: "translate3d(0, 0, 0)" },
          ]
        : [
            {
              opacity: 0.25,
              filter: "blur(5px)",
              transform: "translate3d(0, 28px, 0) scale(0.985)",
            },
            {
              opacity: 1,
              filter: "blur(0)",
              transform: "translate3d(0, 0, 0) scale(1)",
            },
          ];

    const markedElements = Array.from(
      element.querySelectorAll<HTMLElement>("[data-signin-entrance]"),
    );
    const targets = markedElements.length > 0 ? markedElements : [element];
    const animations = targets.map((target, index) =>
      target.animate(keyframes, {
        duration: prefersReducedMotion ? 200 : variant === "brand" ? 460 : 480,
        delay: prefersReducedMotion
          ? index * 30
          : (variant === "brand" ? 30 : 70) + index * 65,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      }),
    );

    return () => animations.forEach((animation) => animation.cancel());
  }, [variant]);

  return (
    <div
      ref={entranceRef}
      className={`${className} signin-entrance signin-entrance--${variant}`}
    >
      {children}
    </div>
  );
}
