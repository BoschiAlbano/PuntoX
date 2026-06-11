"use client";

import { useEffect, useState } from "react";

/**
 * SplashScreen — aparece al abrir la PWA en modo standalone.
 * Se oculta automáticamente después de que la app carga.
 * Respeta `prefers-reduced-motion`.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    // Solo mostrar el splash en modo standalone (PWA instalada)
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (!isPWA) return;

    // Evitar mostrar el splash más de una vez por sesión
    const shown = sessionStorage.getItem("puntox_splash_shown");
    if (shown) return;

    sessionStorage.setItem("puntox_splash_shown", "1");
    setVisible(true);

    const hideTimeout = setTimeout(() => {
      setHiding(true);
      setTimeout(() => setVisible(false), 600);
    }, 2400);

    return () => clearTimeout(hideTimeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`splash-root ${hiding ? "splash-out" : "splash-in"}`}
    >
      {/* Background radial glow */}
      <div className="splash-glow" />

      {/* Grid overlay */}
      <div className="splash-grid" />

      {/* Content */}
      <div className="splash-content">
        {/* Logo icon */}
        <div className="splash-logo-wrapper">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="splash-logo-svg"
          >
            <defs>
              <linearGradient
                id="splashGrad"
                x1="20"
                y1="80"
                x2="80"
                y2="20"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
            </defs>

            {/* Ghost arms */}
            <path
              d="M50 50 L25 25"
              stroke="url(#splashGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.35"
              className="splash-arm splash-arm-1"
            />
            <path
              d="M50 50 L75 75"
              stroke="url(#splashGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.35"
              className="splash-arm splash-arm-2"
            />

            {/* Main arms */}
            <path
              d="M50 50 L25 75"
              stroke="url(#splashGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              className="splash-arm splash-arm-3"
            />
            <path
              d="M50 50 L75 25"
              stroke="url(#splashGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              className="splash-arm splash-arm-4"
            />

            {/* Center dot */}
            <circle
              cx="50"
              cy="50"
              r="7"
              fill="url(#splashGrad)"
              className="splash-center-dot"
            />

            {/* Accent dot top-right */}
            <circle
              cx="75"
              cy="25"
              r="9"
              fill="#2dd4bf"
              className="splash-accent-dot"
            />
          </svg>

          {/* Pulse ring */}
          <div className="splash-pulse-ring" />
        </div>

        {/* Text */}
        <div className="splash-text-group">
          <h1 className="splash-title">Punto X</h1>
          <p className="splash-subtitle">Sistema de Gestión Empresarial</p>
        </div>

        {/* Loading dots */}
        <div className="splash-dots" aria-label="Cargando...">
          <span className="splash-dot splash-dot-1" />
          <span className="splash-dot splash-dot-2" />
          <span className="splash-dot splash-dot-3" />
        </div>
      </div>

      <style>{`
        .splash-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0F2233;
          overflow: hidden;
        }

        .splash-in {
          animation: splashFadeIn 0.4s ease forwards;
        }

        .splash-out {
          animation: splashFadeOut 0.6s ease forwards;
          pointer-events: none;
        }

        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes splashFadeOut {
          0%   { opacity: 1; transform: scale(1); }
          60%  { opacity: 1; transform: scale(1.04); }
          100% { opacity: 0; transform: scale(1.08); }
        }

        /* Radial glow */
        .splash-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 45% at 50% 42%, rgba(103,175,195,0.14) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 75% 25%, rgba(45,212,191,0.10) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Subtle grid */
        .splash-grid {
          position: absolute;
          inset: 0;
          opacity: 0.07;
          background-image:
            linear-gradient(to right, rgba(103,175,195,0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(103,175,195,0.5) 1px, transparent 1px);
          background-size: 3rem 3rem;
          pointer-events: none;
        }

        /* Content container */
        .splash-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.75rem;
        }

        /* Logo wrapper */
        .splash-logo-wrapper {
          position: relative;
          width: 110px;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .splash-logo-svg {
          width: 90px;
          height: 90px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 0 18px rgba(103,175,195,0.45));
        }

        /* Pulse ring behind logo */
        .splash-pulse-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid rgba(103,175,195,0.25);
          animation: splashPulse 2s ease-in-out infinite;
        }

        @keyframes splashPulse {
          0%, 100% { transform: scale(1);    opacity: 0.4; }
          50%       { transform: scale(1.12); opacity: 0.15; }
        }

        /* SVG arm draw animation */
        .splash-arm {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: drawArm 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .splash-arm-1 { animation-delay: 0.1s; }
        .splash-arm-2 { animation-delay: 0.2s; }
        .splash-arm-3 { animation-delay: 0.05s; }
        .splash-arm-4 { animation-delay: 0.15s; }

        @keyframes drawArm {
          to { stroke-dashoffset: 0; }
        }

        .splash-center-dot {
          transform-origin: 50px 50px;
          animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
        }

        .splash-accent-dot {
          transform-origin: 75px 25px;
          animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.65s both;
        }

        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        /* Text group */
        .splash-text-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .splash-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f1f5f9;
          margin: 0;
          line-height: 1;
        }

        .splash-subtitle {
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #67afc3;
          margin: 0;
        }

        /* Loading dots */
        .splash-dots {
          display: flex;
          gap: 0.45rem;
          animation: slideUp 0.4s ease 0.7s both;
        }

        .splash-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #67afc3;
          animation: dotBounce 1.2s ease-in-out infinite;
        }
        .splash-dot-1 { animation-delay: 0s;    }
        .splash-dot-2 { animation-delay: 0.18s; }
        .splash-dot-3 { animation-delay: 0.36s; }

        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1;   }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .splash-arm,
          .splash-center-dot,
          .splash-accent-dot,
          .splash-text-group,
          .splash-dots,
          .splash-pulse-ring,
          .splash-dot { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
