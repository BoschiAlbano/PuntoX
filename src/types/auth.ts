export type TenantUser = {
  id: string;
  email?: string;
  tenantId?: string | number | null;
  role?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};
