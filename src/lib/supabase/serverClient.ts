import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// funcion para obtener el cliente de supabase en el servidor
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "[supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components tienen cookies de solo lectura — ignorar silenciosamente.
          // El token se refresca correctamente en el próximo Route Handler.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Server Components tienen cookies de solo lectura — ignorar silenciosamente.
        }
      },
    },
  });
}
