import { describe, it, expect } from "vitest";
import { sessionIdDesdeCookies } from "./sesionActual";

const b64url = (s: string) => Buffer.from(s).toString("base64url");
/** JWT falso: solo importa el payload. */
const jwt = (sessionId: string) => `h.${b64url(JSON.stringify({ session_id: sessionId }))}.s`;
const sesionJson = (sessionId: string) => JSON.stringify({ access_token: jwt(sessionId) });

describe("sessionIdDesdeCookies", () => {
  it("lee el formato actual de @supabase/ssr (base64-...)", () => {
    const cookies = [{ name: "sb-abc-auth-token", value: `base64-${b64url(sesionJson("sess-1"))}` }];
    expect(sessionIdDesdeCookies(cookies)).toBe("sess-1");
  });

  it("lee el formato viejo (JSON plano)", () => {
    expect(sessionIdDesdeCookies([{ name: "sb-abc-auth-token", value: sesionJson("sess-2") }])).toBe("sess-2");
  });

  it("une la cookie partida en .0, .1, ... en orden", () => {
    const valor = `base64-${b64url(sesionJson("sess-3"))}`;
    const mitad = Math.floor(valor.length / 2);
    const cookies = [
      { name: "sb-abc-auth-token.1", value: valor.slice(mitad) },
      { name: "otra", value: "x" },
      { name: "sb-abc-auth-token.0", value: valor.slice(0, mitad) },
    ];
    expect(sessionIdDesdeCookies(cookies)).toBe("sess-3");
  });

  it("devuelve null si no hay cookie o no se puede leer", () => {
    expect(sessionIdDesdeCookies([])).toBeNull();
    expect(sessionIdDesdeCookies([{ name: "sb-abc-auth-token", value: "base64-@@roto" }])).toBeNull();
    expect(sessionIdDesdeCookies([{ name: "sb-abc-auth-token", value: "{}" }])).toBeNull();
  });
});
