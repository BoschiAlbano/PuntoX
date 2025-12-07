import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      roll?: string;
      medicamento?: boolean;
      tenantId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    roll?: string;
    medicamento?: boolean;
    tenantId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roll?: string;
    medicamento?: boolean;
    tenantId?: string;
  }
}
