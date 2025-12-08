# Supabase Auth – Migración y uso

Documentación detallada de la sustitución de NextAuth por Supabase Auth y cómo operar el proyecto en este esquema multi-tenant.

## Objetivo
- Autenticación y sesión gestionadas por Supabase Auth.
- Mantener multi-tenant usando `tenant_id` en el JWT/metadata.
- Mantener tablas Prisma existentes (Usuario, Persona, etc.) para compatibilidad y datos de negocio.

## Dependencias y variables de entorno
- Nuevas deps: `@supabase/supabase-js`, `@supabase/ssr`. Se removieron NextAuth y su adapter.
- `.env` requiere (placeholder):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (solo servidor, no exponer)
  - Opcional fallback tenant: `NEXT_PUBLIC_TENANT_ID` o `DEFAULT_TENANT_ID`

## Clientes Supabase
- `src/lib/supabase/browserClient.ts`: singleton para cliente.
- `src/lib/supabase/serverClient.ts`: para server/middleware con manejo de cookies.
- `src/lib/supabase/serviceClient.ts`: usa service role (admin) para crear usuarios en Supabase Auth.

## Contexto de sesión y hook
- `src/components/auth/sessionProvider.tsx`: reemplaza el provider de NextAuth. Expone `session`, `user` (con `tenantId` derivado de metadata), `status`, `supabase`.
- `src/hooks/useAuth.ts`: login con `supabase.auth.signInWithPassword`, logout con `supabase.auth.signOut`, expone `isAuthenticated`/`isLoading`.

## Protección de rutas
- `src/middleware.ts`: verifica sesión Supabase y redirige a `/signin` si no está autenticado (ignora rutas públicas y assets).
- Layouts:
  - `src/app/(dashboard)/layout.tsx`: fuerza login, muestra loading.
  - `src/app/(auth)/layout.tsx`: si ya hay sesión, redirige a `/ventas`.

## Componentes y API adaptados
- `src/components/dashboard/DashboardHeader.tsx`: lee usuario desde `useAuth`, logout Supabase.
- `src/components/marcas/MarcaCRUD.tsx`: usa `tenantId` de Supabase metadata al crear.
- `src/app/api/marcas/route.ts`: usa `getSupabaseServerClient()` para obtener usuario; filtra/crea por `tenant_id`.
- Página de prueba: `src/app/(dashboard)/test/page.tsx` muestra datos de sesión Supabase.

## Registro de usuarios/tenants
- `src/app/api/auth/register/route.ts`: crea usuario en Supabase Auth (service role) con `user_metadata: { tenant_id, role: "Empleado" }` y luego registra en Prisma (Persona, Usuario, etc.).
- `src/app/actions/register-tenant.ts`: al crear tenant + admin, también crea usuario admin en Supabase Auth con metadata `{ tenant_id, role: "Administrador" }`.

## Metadata esperada en Supabase Auth
- `user_metadata.tenant_id` (string) → se mapea a `tenantId`.
- `user_metadata.role` (Administrador/Empleado u otro).
Si falta `tenant_id`, se usa `NEXT_PUBLIC_TENANT_ID`/`DEFAULT_TENANT_ID` como respaldo.

## Flujo de login
1) Usuario se autentica en Supabase (credenciales).
2) El middleware valida la cookie de Supabase y permite acceso a rutas protegidas.
3) `useAuth` entrega `user` y `tenantId` a componentes y APIs.

## Migración de usuarios existentes
- Crear en Supabase Auth cada usuario actual con su email y `user_metadata.tenant_id` correcto (UI de Supabase o script con `serviceClient`).
- Roles opcionales en `user_metadata.role`.
- El hash local en `Usuario.Password` se conserva para compatibilidad, pero el login activo depende de Supabase Auth.

## Checklist de configuración
1) Completar las variables Supabase en `.env`.
2) Crear usuarios en Supabase Auth con `tenant_id` en metadata (o usar los endpoints de registro/tenant).
3) Levantar: `npm run dev`.
4) Probar login en `/signin`, navegar dashboard, y probar `GET/POST /api/marcas` (verifica filtrado por tenant).

## Archivos clave cambiados
- Dependencias/env: `package.json`, `package-lock.json`, `.env`.
- Clientes Supabase: `src/lib/supabase/*`.
- Contexto y hooks: `src/components/auth/sessionProvider.tsx`, `src/hooks/useAuth.ts`.
- Protección: `src/middleware.ts`, layouts en `src/app/(auth|dashboard)/layout.tsx`.
- APIs/Componentes: `src/app/api/marcas/route.ts`, `src/components/marcas/MarcaCRUD.tsx`, `src/components/dashboard/DashboardHeader.tsx`, `src/app/(dashboard)/test/page.tsx`.
- Registro: `src/app/api/auth/register/route.ts`, `src/app/actions/register-tenant.ts`.

## UI de autenticación (sin `useAuth` ni NextAuth)
- Login (`src/components/auth/CredentialsForm.tsx`): usa `getSupabaseBrowserClient` y `supabase.auth.signInWithPassword`, luego navega a `/ventas`.
- Registro (`src/components/auth/RegistrationForm.tsx`): crea usuario vía `/api/auth/register` y auto-login con `supabase.auth.signInWithPassword`, redirige a `/ventas`.
- Header (`src/components/dashboard/DashboardHeader.tsx`): lee `user` desde `useSupabaseAuthContext` y cierra sesión con `supabase.auth.signOut`.
- Layouts (`src/app/(auth)/layout.tsx`, `src/app/(dashboard)/layout.tsx`): usan `useSupabaseAuthContext` para redirigir según estado de sesión.
- Página de prueba (`src/app/(dashboard)/test/page.tsx`): muestra `user`/`session` desde el contexto de Supabase.

## Notas y pruebas sugeridas
- Verifica en consola que no aparezcan errores de env Supabase al arrancar.
- Probar login/logout; validar que el middleware bloquee rutas protegidas sin sesión.
- Crear/leer marcas y confirmar que operan sobre el `tenant_id` del usuario.
- Si algo falla en creación de usuarios, revisar permisos de la service role y que las env estén cargadas en el runtime.
