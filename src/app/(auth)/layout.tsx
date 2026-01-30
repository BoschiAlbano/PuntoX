import { LoadingPage } from "@/components/loading/loading";
import { NorequireAuthServer } from "@/lib/requireSuperAdmin";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await NorequireAuthServer({ redirectUrl: "/ventas" });

  return <Suspense fallback={<LoadingPage />}>{children}</Suspense>;
}
