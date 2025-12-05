# Configuracion de Variables de Entorno - Punto X SaaS

## Variables obligatorias

Coloca estas variables en `.env.local` en la raiz del proyecto:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-clave-secreta-de-nextauth-aqui-muy-larga-y-segura
NEXTAUTH_JWT_SECRET=tu-clave-secreta-jwt-aqui-diferente-de-la-anterior

# Base de datos
DATABASE_URL="tu-connection-string-aqui"

# Tenancy
DEFAULT_TENANT_ID=1
NEXT_PUBLIC_TENANT_ID=1
```

## Pasos rapidos
1. Crear `.env.local` con las variables anteriores.
2. Generar claves seguras (ejemplo):  
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Reiniciar el servidor: `npm run dev`.

## Verificacion
En consola del servidor deberias ver que NextAuth arranca sin quejas de configuracion. Si se listan variables faltantes, revisa el archivo `.env.local`.

## Estructura relevante
```
punto-x/
  .env.local
  src/utilities/auth/authOptions.ts
  package.json
```

## Solucion de problemas

### Error: "Configuration"
- Falta alguna variable (`NEXTAUTH_SECRET`, `NEXTAUTH_JWT_SECRET`, `NEXTAUTH_URL`).
- Revisa `.env.local` y reinicia el servidor.

### Error: "Cannot connect to database"
- Verifica `DATABASE_URL`.
- Asegura que la base de datos este arriba.
- Ejecuta `npm run prisma:generate` si cambiaste el schema.

### Error: "Invalid credentials"
- Confirma que el usuario existe y que la contrasena esta hasheada con bcrypt.

## Notas
- No hay login con Google en este proyecto; solo email/clave.
- `DEFAULT_TENANT_ID` se usa en el registro si no se envia `tenantId` desde el cliente.
