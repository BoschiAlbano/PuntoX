/**
 * Configuración global para tests
 */
import { beforeAll, afterAll, vi } from "vitest";

// Mock de variables de entorno
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

beforeAll(() => {
  // Configuración antes de todos los tests
});

afterAll(() => {
  // Limpieza después de todos los tests
});

