"use client";
import React from "react";
import { useSession } from "next-auth/react";

export default function page() {
  const { data: session } = useSession();

  return (
    <div>
      <h1>Session: {session?.user?.name}</h1>
      <h1>Email: {session?.user?.email}</h1>
      <h1>Roll: {session?.user?.roll}</h1>
      <h1>TenantId: {session?.user?.tenantId}</h1>
    </div>
  );
}
