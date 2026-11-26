import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { invitarEmpleado, reenviarInvitacionEmpleado } from "./invitacion";

const inviteUserByEmail = vi.fn();
const resetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/serviceClient", () => ({
  getSupabaseServiceClient: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ auth: { resetPasswordForEmail } })),
}));

const datos = { username: "juan", comercio: "Kiosco Ana" };

describe("invitarEmpleado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: { admin: { inviteUserByEmail } },
    } as any);
  });

  it("invita con el usuario y el comercio en user_metadata", async () => {
    inviteUserByEmail.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await invitarEmpleado({ email: "juan@mail.com", ...datos });
    expect(res).toEqual({ ok: true, user: { id: "u1" } });
    expect(inviteUserByEmail).toHaveBeenCalledWith("juan@mail.com", {
      data: { username: "juan", comercio: "Kiosco Ana" },
    });
  });

  it("distingue el email ya registrado de otros errores", async () => {
    inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { code: "email_exists", message: "A user with this email address has already been registered" },
    });
    expect(await invitarEmpleado({ email: "a@b.com", ...datos })).toEqual({
      ok: false,
      motivo: "email_registrado",
    });

    inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { status: 429, message: "email rate limit exceeded" },
    });
    expect(await invitarEmpleado({ email: "a@b.com", ...datos })).toMatchObject({
      ok: false,
      motivo: "error",
    });
  });
});

describe("reenviarInvitacionEmpleado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: { admin: { inviteUserByEmail } },
    } as any);
    resetPasswordForEmail.mockResolvedValue({ error: null });
  });

  it("no reenvía si el usuario ya activó su cuenta", async () => {
    const res = await reenviarInvitacionEmpleado(
      { email: "juan@mail.com", email_confirmed_at: "2026-11-01T00:00:00Z" },
      datos,
    );
    expect(res).toEqual({ ok: false, motivo: "ya_activo" });
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("reinvita si todavía no la aceptó", async () => {
    inviteUserByEmail.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const res = await reenviarInvitacionEmpleado(
      { email: "Juan@Mail.com", email_confirmed_at: undefined },
      datos,
    );
    expect(res).toEqual({ ok: true, via: "invitacion" });
    expect(inviteUserByEmail).toHaveBeenCalledWith("juan@mail.com", expect.anything());
  });

  it("si Supabase rechaza la reinvitación, envía un link por recuperación", async () => {
    inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { code: "email_exists", message: "already been registered" },
    });
    const res = await reenviarInvitacionEmpleado(
      { email: "juan@mail.com", email_confirmed_at: undefined },
      datos,
    );
    expect(res).toEqual({ ok: true, via: "recuperacion" });
    expect(resetPasswordForEmail).toHaveBeenCalledWith("juan@mail.com");
  });
});
