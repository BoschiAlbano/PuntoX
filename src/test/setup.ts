/**
 * Configuración global para tests (Vitest).
 * Se ejecuta en todos los tests: API (node) y componentes (jsdom).
 */
import { beforeAll, afterAll, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// ——— Variables de entorno (mocks) ———
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "test-anon-key";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";

// ——— Mocks globales ———
// El App Router nunca está montado en tests unitarios; sin este mock cualquier
// componente que use useRouter/useSearchParams (ej. GenericCrud, que sincroniza
// filtros con la URL) falla con "invariant expected app router to be mounted".
// Un vi.mock("next/navigation") dentro de un test tiene prioridad sobre este.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

beforeAll(() => {
  // Configuración antes de todos los tests
});

afterAll(() => {
  // Limpieza después de todos los tests
});

