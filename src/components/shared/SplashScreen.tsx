"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
          <Image
            src="/brand/puntox-isotipo.png"
            alt=""
            width={827}
            height={688}
            className="splash-logo-image"
          />

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
            radial-gradient(ellipse 60% 45% at 50% 42%, rgba(0,106,252,0.14) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 75% 25%, rgba(250,105,0,0.10) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Subtle grid */
        .splash-grid {
          position: absolute;
          inset: 0;
          opacity: 0.07;
          background-image:
            linear-gradient(to right, rgba(0,106,252,0.35) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,106,252,0.35) 1px, transparent 1px);
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

        .splash-logo-image {
          width: 90px;
          height: auto;
          max-height: 90px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 0 18px rgba(0,106,252,0.35)) drop-shadow(0 0 12px rgba(250,105,0,0.2));
          animation: splashLogoEnter 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes splashLogoEnter {
          from { opacity: 0; transform: scale(0.88); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Pulse ring behind logo */
        .splash-pulse-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid rgba(0,106,252,0.28);
          animation: splashPulse 2s ease-in-out infinite;
        }

        @keyframes splashPulse {
          0%, 100% { transform: scale(1);    opacity: 0.4; }
          50%       { transform: scale(1.12); opacity: 0.15; }
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
          color: #FA6900;
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
          background: #006AFC;
          animation: dotBounce 1.2s ease-in-out infinite;
        }
        .splash-dot:nth-child(2) { background: #FA6900; }
        .splash-dot-1 { animation-delay: 0s;    }
        .splash-dot-2 { animation-delay: 0.18s; }
        .splash-dot-3 { animation-delay: 0.36s; }

        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1;   }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .splash-logo-image,
          .splash-text-group,
          .splash-dots,
          .splash-pulse-ring,
          .splash-dot { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
