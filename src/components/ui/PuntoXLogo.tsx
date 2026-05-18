"use client";

import { useId } from "react";

interface PuntoXLogoProps {
  className?: string;
  /** Si es true, la animación se ejecuta de forma infinita (modo spinner). */
  spinner?: boolean;
}

export function PuntoXLogo({
  className = "w-12 h-12",
  spinner = false,
}: PuntoXLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `pxg-${uid}`;
  const rc = spinner ? "indefinite" : "1";

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id={gradId}
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

      {/* Punto central: aparece y desaparece desde su centro (50,50) */}
      <g transform="translate(50,50)">
        <circle cx="0" cy="0" r="7" fill={`url(#${gradId})`}>
          <animateTransform
            attributeName="transform"
            type="scale"
            values="0;1;1;0;0"
            keyTimes={spinner ? "0;0.105;0.211;0.395;1" : "0;0.13;0.35;0.52;1"}
            dur={spinner ? "1.9s" : "1.5s"}
            repeatCount={rc}
            fill="freeze"
          />
        </circle>
      </g>

      {/* Brazos difuminados: se dibujan desde el centro */}
      <path
        d="M50 50 L25 25"
        stroke={`url(#${gradId})`}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray="36"
        strokeDashoffset="36"
        opacity="0.4"
      >
        <animate
          attributeName="stroke-dashoffset"
          values={spinner ? "36;36;0;0;36" : "36;0"}
          keyTimes={spinner ? "0;0.237;0.632;0.999;1" : "0;1"}
          dur={spinner ? "1.9s" : "0.75s"}
          begin={spinner ? undefined : "0.45s"}
          repeatCount={rc}
          fill="freeze"
        />
      </path>
      <path
        d="M50 50 L75 75"
        stroke={`url(#${gradId})`}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray="36"
        strokeDashoffset="36"
        opacity="0.4"
      >
        <animate
          attributeName="stroke-dashoffset"
          values={spinner ? "36;36;0;0;36" : "36;0"}
          keyTimes={spinner ? "0;0.237;0.632;0.999;1" : "0;1"}
          dur={spinner ? "1.9s" : "0.75s"}
          begin={spinner ? undefined : "0.45s"}
          repeatCount={rc}
          fill="freeze"
        />
      </path>

      {/* Brazos sólidos: se dibujan desde el centro */}
      <path
        d="M50 50 L25 75"
        stroke={`url(#${gradId})`}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray="36"
        strokeDashoffset="36"
      >
        <animate
          attributeName="stroke-dashoffset"
          values={spinner ? "36;36;0;0;36" : "36;0"}
          keyTimes={spinner ? "0;0.237;0.632;0.999;1" : "0;1"}
          dur={spinner ? "1.9s" : "0.75s"}
          begin={spinner ? undefined : "0.45s"}
          repeatCount={rc}
          fill="freeze"
        />
      </path>
      <path
        d="M50 50 L75 25"
        stroke={`url(#${gradId})`}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray="36"
        strokeDashoffset="36"
      >
        <animate
          attributeName="stroke-dashoffset"
          values={spinner ? "36;36;0;0;36" : "36;0"}
          keyTimes={spinner ? "0;0.237;0.632;0.999;1" : "0;1"}
          dur={spinner ? "1.9s" : "0.75s"}
          begin={spinner ? undefined : "0.45s"}
          repeatCount={rc}
          fill="freeze"
        />
      </path>

      {/* Punto acento: pop con rebote desde su centro (75,25) */}
      <g transform="translate(75,25)">
        <circle
          cx="0"
          cy="0"
          r="10"
          fill="#2dd4bf"
          visibility={spinner ? undefined : "hidden"}
        >
          {!spinner && (
            <set
              attributeName="visibility"
              to="visible"
              begin="1.1s"
              fill="freeze"
            />
          )}
          <animateTransform
            attributeName="transform"
            type="scale"
            values={spinner ? "0;0;1.3;0.9;1;1;0" : "0;1.3;0.9;1"}
            keyTimes={
              spinner ? "0;0.579;0.789;0.895;0.921;0.999;1" : "0;0.6;0.8;1"
            }
            dur={spinner ? "1.9s" : "0.45s"}
            begin={spinner ? undefined : "1.1s"}
            repeatCount={rc}
            fill="freeze"
          />
        </circle>
      </g>
    </svg>
  );
}
