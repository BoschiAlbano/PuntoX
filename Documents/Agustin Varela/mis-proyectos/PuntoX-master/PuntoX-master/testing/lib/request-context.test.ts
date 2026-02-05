import { describe, expect, it } from "vitest";
import {
  clearRequestContext,
  getRequestAuthContext,
  requestContext,
  setRequestAuthContext,
} from "@/lib/auth/requestContext";

describe("requestContext auth cache", () => {
  it("retorna undefined fuera de un contexto activo", () => {
    expect(getRequestAuthContext()).toBeUndefined();
  });

  it("permite guardar y leer authContext dentro del request", () => {
    requestContext.run(new Map(), () => {
      const authContext = {
        tenantId: 1,
        usuarioId: 2,
        sucursalId: 3,
        isSuperAdmin: false,
        permissions: ["productos"],
        user: { id: "user-1" },
      } as any;

      setRequestAuthContext(authContext);
      expect(getRequestAuthContext()).toEqual(authContext);
    });
  });

  it("clearRequestContext elimina datos del request actual", () => {
    requestContext.run(new Map(), () => {
      setRequestAuthContext(
        {
          tenantId: 10,
          usuarioId: 20,
          sucursalId: 30,
          isSuperAdmin: false,
          permissions: [],
          user: { id: "user-2" },
        } as any
      );
      expect(getRequestAuthContext()).toBeDefined();

      clearRequestContext();
      expect(getRequestAuthContext()).toBeUndefined();
    });
  });

  it("mantiene aislamiento entre requests distintos", () => {
    requestContext.run(new Map(), () => {
      setRequestAuthContext({ tenantId: 999 } as any);
      expect(getRequestAuthContext()?.tenantId).toBe(999);
    });

    requestContext.run(new Map(), () => {
      expect(getRequestAuthContext()).toBeUndefined();
    });
  });

  it("propaga el contexto en operaciones async del mismo request", async () => {
    await requestContext.run(new Map(), async () => {
      setRequestAuthContext({ tenantId: 321 } as any);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(getRequestAuthContext()?.tenantId).toBe(321);
          resolve();
        }, 0);
      });
    });
  });
});
