"use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { redirect } from "next/navigation";
export default function page() {
  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    redirect("/signin");
  };
  return (
    <section className="flex flex-col items-center justify-center h-screen gap-4">
      <img
        src="/favicon-light.ico"
        alt="Punto X"
        className="w-24 h-24 object-contain"
      />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">No tienes sucursales</h1>
        <p className="text-slate-500">
          No tienes sucursales disponibles para ti, por favor contacta al
          administrador
        </p>
      </div>
      <button
        onClick={() => handleLogout()}
        className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
      >
        Cerrar sesión
      </button>
    </section>
  );
}
