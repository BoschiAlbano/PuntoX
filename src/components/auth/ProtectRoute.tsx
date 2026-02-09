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
  const { canAccessRoute, isLoading, isInitialized } = useUserStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    // Public or implicitly allowed routes (basic fallback, but store handles this too)
    if (pathname === "/dashboard" || pathname === "/") {
      setAuthorized(true);
      return;
    }

    const isAllowed = canAccessRoute(pathname);

    if (!isAllowed) {
      console.warn(`Access denied to ${pathname}`);
      router.push("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [pathname, isInitialized, canAccessRoute, router]);

  if (isLoading || !isInitialized) {
    return null;
  }

  // Prevent flash of unauthorized content
  if (!authorized) return null;

  return <>{children}</>;
}
