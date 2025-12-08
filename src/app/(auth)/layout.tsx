"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/loading/loading";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { status } = useSupabaseAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/ventas");
    }
  }, [status, router]);

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "authenticated") {
    return null;
  }

  return <div>{children}</div>;
}
