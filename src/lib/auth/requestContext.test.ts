/**
 * Tests para requestContext (getRequestAuthContext, setRequestAuthContext, clearRequestContext).
 */
import { describe, it, expect } from "vitest";
import {
  getRequestAuthContext,
  setRequestAuthContext,
  clearRequestContext,
  requestContext,
} from "./requestContext";
import type { AuthContext } from "./getAuthUser";

describe("requestContext", () => {
  const mockAuthContext: AuthContext = {
    user: { id: "user-1", email: "test@test.com" } as AuthContext["user"],
    dbUser: { Id: 1, NombreUsuario: "test" } as AuthContext["dbUser"],
    permisos: ["ventas:read"],
  };

  it("getRequestAuthContext retorna undefined cuando no hay contexto activo", () => {
    // Fuera de run() no hay store
    expect(getRequestAuthContext()).toBeUndefined();
  });

  it("setRequestAuthContext y getRequestAuthContext guardan y recuperan el contexto", () => {
    requestContext.run(new Map(), () => {
      setRequestAuthContext(mockAuthContext);
      const result = getRequestAuthContext();
      expect(result).toEqual(mockAuthContext);
    });
  });

  it("clearRequestContext limpia el store", () => {
    requestContext.run(new Map(), () => {
      setRequestAuthContext(mockAuthContext);
      expect(getRequestAuthContext()).toEqual(mockAuthContext);
      clearRequestContext();
      expect(getRequestAuthContext()).toBeUndefined();
    });
  });

  it("setRequestAuthContext no hace nada cuando el store es undefined", () => {
    // Dentro de run el store existe; fuera no. No podemos llamar set sin run sin mock.
    // Este caso está cubierto implícitamente: si getStore() retorna undefined, el if (store) no ejecuta set.
    expect(() => setRequestAuthContext(mockAuthContext)).not.toThrow();
  });
});
