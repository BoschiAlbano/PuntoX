"use client";

import React from "react";

interface LoadingViewProps {
  size?: number | string;
  className?: string;
  message?: string;
}

const bluePath =
  "M7394 14210c-77 115-93 128-186 229-1477 1694-3083 3739-4626 5340-344 357-240 657 100 714 759 127 2956-26 3881-25 499 0 589-141 838-437 1655-1886 3303-3777 4954-5665 215-241-140-472-364-779-1310-1801-2985-3701-4431-5476-83-114-307-249-493-249H2914c-197 0-379 105-404 305-21 171 164 340 263 458 1532 1858 3113 3709 4619 5585z";

const orangeTopPath =
  "M10152 10829c54 80 76 109 140 186 661 823 1326 1640 1988 2461 83 95 247 321 334 378 122-82 357-391 467-512 72-80 4457-4868 4457-5124 0-220-192-356-415-356h-4123c-310 0-446 187-571 319-47 50-44 44-82 96-733 852-1463 1699-2195 2551z";

const orangeBottomPath =
  "M10063 17414c796 935 1595 1868 2380 2811 88 106 310 245 497 245h4242c261 0 326-125 326-297 0-91-212-284-279-374-528-655-4250-4968-4633-5286-132 157-23 27-153 179-733 826-1520 1679-2224 2522-81 79-96 112-156 200z";

export function AuthLoadingView({
  message = "Cargando...",
  className = "",
  size = 90,
}: LoadingViewProps) {
  const id = React.useId().replace(/:/g, "");

  const blueGradientId = "loading-blue-" + id;
  const orangeGradientId = "loading-orange-" + id;

  return (
    <div
      className={"punto-loading " + className}
      style={{
        width: size,
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {" "}
      <div className="punto-loading__logo-wrapper">
        {" "}
        <svg
          className="punto-loading__svg"
          viewBox="2400 5000 15300 16000"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {" "}
          <defs>
            {" "}
            <linearGradient
              id={blueGradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              {" "}
              <stop offset="0%" stopColor="#0068FA" />{" "}
              <stop offset="100%" stopColor="#38A0FF" />{" "}
            </linearGradient>
            ```
            <linearGradient
              id={orangeGradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FF8A24" />
              <stop offset="100%" stopColor="#FB6700" />
            </linearGradient>
          </defs>
          {/* Halo exterior */}
          <circle
            className="punto-loading__ring punto-loading__ring--outer"
            cx="10050"
            cy="13000"
            r="7200"
            fill="none"
            stroke="currentColor"
            strokeWidth="90"
            strokeLinecap="round"
            strokeDasharray="900 1700"
          />
          {/* Halo interior */}
          <circle
            className="punto-loading__ring punto-loading__ring--inner"
            cx="10050"
            cy="13000"
            r="6500"
            fill="none"
            stroke="currentColor"
            strokeWidth="55"
            strokeLinecap="round"
            strokeDasharray="500 2200"
          />
          {/* PIEZA AZUL */}
          <g className="punto-loading__piece punto-loading__piece--blue">
            <path d={bluePath} fill={"url(#" + blueGradientId + ")"} />

            <path
              className="punto-loading__edge"
              d={bluePath}
              fill="none"
              stroke="white"
              strokeWidth="110"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          {/* PIEZA NARANJA SUPERIOR */}
          <g className="punto-loading__piece punto-loading__piece--top">
            <path d={orangeTopPath} fill={"url(#" + orangeGradientId + ")"} />

            <path
              className="punto-loading__edge"
              d={orangeTopPath}
              fill="none"
              stroke="white"
              strokeWidth="110"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          {/* PIEZA NARANJA INFERIOR */}
          <g className="punto-loading__piece punto-loading__piece--bottom">
            <path
              d={orangeBottomPath}
              fill={"url(#" + orangeGradientId + ")"}
            />

            <path
              className="punto-loading__edge"
              d={orangeBottomPath}
              fill="none"
              stroke="white"
              strokeWidth="110"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
      {/* MENSAJE */}
      <div className="punto-loading__message">
        <span>{message}</span>

        <span className="punto-loading__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  );
}

export function LoadingSpinner({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return <AuthLoadingView message={message} />;
}

export function LoadingPage({
  message = "Verificando autenticación...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen w-full bg-[#F6FAFC] flex items-center justify-center">
      {" "}
      <AuthLoadingView size={120} message={message} />{" "}
    </div>
  );
}

export function LoadingComponent({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div className="w-full h-full min-h-[300px] bg-transparent flex items-center justify-center">
      {" "}
      <AuthLoadingView size={100} message={message} />{" "}
    </div>
  );
}

export default AuthLoadingView;
