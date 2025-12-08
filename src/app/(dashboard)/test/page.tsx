"use client";
import React from "react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

export default function Page() {
  const { user, session } = useSupabaseAuthContext();
  const roleFromMetadata =
    typeof user?.user_metadata?.role === "string"
      ? user.user_metadata.role
      : null;
  const tenantFromMetadata = user?.user_metadata?.tenant_id as
    | string
    | number
    | null
    | undefined;

  return (
    <div>
      <h1>Session user id: {session?.user?.id}</h1>
      <h1>Email: {user?.email}</h1>
      <h1>Role: {user?.role || roleFromMetadata}</h1>
      <h1>TenantId: {user?.tenantId ?? tenantFromMetadata}</h1>

      {/* user y session */}
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
