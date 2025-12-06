# PuntoX - Notas de entorno y auth

## Entorno y variables
- Usa `.env.local` en la raiz (Next.js lee ese archivo). Para compartir ejemplo tambien existe `.env`.
- Variables requeridas: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_JWT_SECRET`, `DATABASE_URL`, `DEFAULT_TENANT_ID`, `NEXT_PUBLIC_TENANT_ID`.
- Genera secretos de 32+ chars: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- Base de datos: SQL Server. Ajusta `DATABASE_URL` segun tu servidor. Ejecuta `npm run prisma:generate` tras cambiar el schema.
- Script de chequeo: `npm run check-env` valida presencia y longitud de secretos.

## Autenticacion
- Login solo por credenciales internas (no hay Google). Provider en `src/utilities/auth/authOptions.ts`.
- `DEFAULT_TENANT_ID` se usa para filtrar usuarios por tenant en authorize.
- Rutas publicas: `/signin`, `/signup`, favicons y assets estaticos. El resto pasa por middleware que exige sesion.
- Post-login el root `/` redirige a `/ventas`. El layout de `(auth)` redirige a `/ventas` si ya estas autenticado.

## Flujo de UI principal
- Dashboard shell: `src/app/(dashboard)/layout.tsx` con `Sidebar` y `DashboardHeader`.
- Pagina de inicio (ventas): `src/app/(dashboard)/ventas/page.tsx`.
- Signin: `src/app/(auth)/signin/page.tsx` usa `CredentialsForm` y `useAuth`.
- Las secciones `clientes`, `productos`, etc. aun no tienen logica de negocio; `ProductoCRUD` es mock UI y se mantiene sin tocar.

## Rutas API
- Registro: `src/app/api/auth/register/route.ts` (alta de persona/empleado/usuario).
- NextAuth: `src/app/api/auth/[...nextauth]/route.ts`.
- Localidades: `src/app/api/localidades/route.ts`.

## Proteccion de rutas
- Middleware en `src/middleware.ts` valida el token y redirige a `/signin` con `callbackUrl` si no hay sesion.
- Los layouts de `(dashboard)` y `(auth)` evitan mostrar contenido mientras se resuelve la sesion.

## Desarrollo rapido
1) Crea `.env.local` copiando `.env` y ajusta valores reales.
2) `npm install`
3) `npm run prisma:generate` (requiere base SQL Server alcanzable).
4) `npm run dev`

## Estado actual y pendientes
- Login por credenciales funciona y Google esta eliminado.
- CRUD de productos sigue como mock (otro equipo lo opera en produccion).
- Falta documentar y proveer seed/containers para la base SQL Server.
