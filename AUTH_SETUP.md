# Configuracion de Autenticacion y Registro - Punto X SaaS

## Variables de entorno requeridas

Crea un archivo `.env.local` en la raiz del proyecto con las siguientes variables:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-clave-secreta-de-nextauth-aqui
NEXTAUTH_JWT_SECRET=tu-clave-secreta-jwt-aqui

# Base de datos (Prisma)
DATABASE_URL="tu-connection-string-aqui"

# Tenancy
DEFAULT_TENANT_ID=1
NEXT_PUBLIC_TENANT_ID=1
```

## Caracteristicas implementadas

### Autenticacion con credenciales
- Formulario de email y contrasena
- Validacion de campos
- Hash seguro de contrasenas con bcrypt
- Manejo de estados de carga y errores
- Redireccion despues del login exitoso

### Sistema de registro completo
- Formulario de registro con campos del esquema Prisma
- Validacion basica
- Creacion en tablas Persona, Persona_Empleado y Usuario
- Transaccion de base de datos para consistencia
- Verificacion de duplicados (email y nombre de usuario)
- Requiere `TenantId` (usa `DEFAULT_TENANT_ID` si no se envia)

### Integracion con base de datos
- Consulta directa con Prisma (sin adapter de NextAuth)
- Manejo de relaciones entre Persona, Persona_Empleado y Usuario
- Carga de localidades desde la base de datos

### Interfaz de usuario
- Diseno responsivo
- Formularios organizados por secciones
- Transiciones suaves
- Adaptativo a moviles

### Seguridad
- Callbacks de NextAuth configurados
- Hash de contrasenas con bcrypt
- Sesiones JWT
- Validacion en frontend y backend
- Redireccion segura despues del login

## Uso

### 1. Inicio de sesion con credenciales
- Completa el formulario con email y contrasena
- Redireccion despues del login exitoso

### 2. Registro de nuevo usuario
- Completa los campos obligatorios
- Selecciona localidad
- Incluye el `TenantId` (o configura `DEFAULT_TENANT_ID`)
- El sistema crea el usuario en todas las tablas y hace auto-login

## Estructura de archivos

```
src/
  components/auth/
    CredentialsForm.tsx       # Formulario de credenciales
    RegistrationForm.tsx      # Formulario de registro
    Divider.tsx               # Separador visual
  app/
    (auth)/
      signin/
        page.tsx              # Pagina de login
      signup/
        page.tsx              # Pagina de registro
    api/
      auth/
        [...nextauth]/
          route.ts            # API de NextAuth
        register/
          route.ts            # API de registro
      localidades/
        route.ts              # API de localidades
  hooks/
    useAuth.ts                # Hook de autenticacion
  types/
    auth.ts                   # Tipos de NextAuth
  utilities/auth/
    authOptions.ts            # Configuracion de NextAuth
  DB/
    prisma.ts                 # Cliente de Prisma
```

## APIs implementadas

### POST `/api/auth/register`

Registra un nuevo usuario.

**Body:**
```json
{
  "apellido": "string",
  "nombre": "string",
  "dni": "string (opcional)",
  "direccion": "string",
  "telefono": "string (opcional)",
  "mail": "string",
  "localidadId": "string",
  "nombreUsuario": "string",
  "password": "string",
  "tenantId": "number | string (opcional, usa DEFAULT_TENANT_ID si se omite)"
}
```

**Respuesta:**
```json
{
  "message": "Usuario registrado exitosamente",
  "userId": "number",
  "personaId": "number"
}
```

### GET `/api/localidades`

Obtiene todas las localidades disponibles.

**Respuesta:**
```json
[
  {
    "Id": "number",
    "Descripcion": "string"
  }
]
```

## Proximos pasos
1. Configurar las variables de entorno
2. Verificar la conexion a la base de datos
3. Probar autenticacion con credenciales
4. Probar el registro completo
5. Personalizar el diseno segun tus necesidades

## Notas importantes
- Asegura que `NEXTAUTH_SECRET` y `NEXTAUTH_JWT_SECRET` sean distintas y seguras
- Requiere tablas Persona, Persona_Empleado y Usuario
- Carga dinamica de localidades
- Registro usa transacciones para consistencia
- Considera agregar validaciones adicionales segun tu negocio

## Solucion de problemas

### Error de conexion a base de datos
- Verifica `DATABASE_URL`
- Genera Prisma: `npm run prisma:generate`

### Error de registro
- Verifica tablas y campos obligatorios
- Revisa logs del servidor para detalles

### Error de serializacion BigInt
- Usa `serializeBigInt`/`serializeBigIntArray` antes de devolver respuestas JSON
