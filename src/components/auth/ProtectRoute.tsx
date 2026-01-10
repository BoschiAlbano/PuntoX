"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

export default function ProtectRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission, isLoading, isInitialized, roles } = useUserStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    // SuperAdmin bypass
    if (roles.some((r) => r.Tipo === "SUPERADMIN")) {
      setAuthorized(true);
      return;
    }

    // Public or implicitly allowed routes
    if (pathname === "/dashboard" || pathname === "/") {
      setAuthorized(true);
      return;
    }

    const isAllowed = hasPermission(pathname);

    if (!isAllowed) {
      console.warn(`Access denied to ${pathname}`);
      router.push("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [pathname, isInitialized, hasPermission, router, roles]);

  if (isLoading || !isInitialized) {
    return null;
  }

  // Prevent flash of unauthorized content
  if (!authorized) return null;

  return <>{children}</>;
}
