# Configuración de Autenticación y Registro - Punto X SaaS

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-clave-secreta-de-nextauth-aqui

# Google OAuth Provider
GOOGLE_CLIENT_ID=tu-google-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-google-client-secret-aqui

# JWT Secret
NEXTAUTH_JWT_SECRET=tu-clave-secreta-jwt-aqui

# Database (si usas Prisma)
DATABASE_URL="tu-connection-string-aqui"
```

## Configuración de Google OAuth

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ API

### 2. Configurar OAuth 2.0

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth 2.0 Client IDs"
3. Selecciona "Web application"
4. Agrega las URLs de redirección autorizadas:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://tudominio.com/api/auth/callback/google` (producción)
5. Copia el Client ID y Client Secret

### 3. Configurar en el Proyecto

1. Copia las credenciales a tu archivo `.env.local`
2. Reinicia el servidor de desarrollo

## Características Implementadas

### ✅ Autenticación con Google

- Botón de inicio de sesión con Google
- Creación automática de usuarios en la base de datos
- Redirección automática después del login
- Manejo de errores

### ✅ Autenticación con Credenciales

- Formulario de email y contraseña
- Validación de campos
- Hash seguro de contraseñas con bcrypt
- Manejo de estados de carga y errores
- Redirección después del login exitoso

### ✅ Sistema de Registro Completo

- Formulario de registro con todos los campos del esquema Prisma
- Validación en tiempo real
- Creación automática en las tablas: Persona, Persona_Empleado, Usuario
- Transacciones de base de datos para consistencia
- Verificación de duplicados (email y nombre de usuario)

### ✅ Integración con Base de Datos

- Adaptador de Prisma para NextAuth
- Conexión automática con las tablas existentes
- Manejo de relaciones entre Persona, Persona_Empleado y Usuario
- Carga dinámica de localidades desde la base de datos

### ✅ Interfaz de Usuario

- Diseño moderno y responsivo
- Tabs para cambiar entre métodos de autenticación
- Formularios organizados por secciones
- Transiciones suaves
- Diseño adaptativo para móviles

### ✅ Seguridad

- Callbacks de NextAuth configurados
- Hash de contraseñas con bcrypt
- Manejo seguro de sesiones JWT
- Validación de datos en frontend y backend
- Redirección segura después del login

## Estructura de Base de Datos

### Tablas Utilizadas

#### Persona

- `Id` (BigInt, PK)
- `Apellido` (String, 150)
- `Nombre` (String, 200)
- `Dni` (String, 8, opcional)
- `Direccion` (String, 400)
- `Telefono` (String, 25, opcional)
- `Mail` (String, 250)
- `LocalidadId` (BigInt, FK)
- `EstaEliminado` (Boolean)

#### Persona_Empleado

- `Id` (BigInt, PK, FK a Persona)
- `Legajo` (Int)
- `Foto` (Bytes)

#### Usuario

- `Id` (BigInt, PK)
- `EmpleadoId` (BigInt, FK a Persona_Empleado)
- `Nombre` (String, 50)
- `Password` (String, 400)
- `EstaBloqueado` (Boolean)
- `EstaEliminado` (Boolean)

## Uso

### 1. **Inicio de Sesión con Google**

- Haz clic en el botón "Continuar con Google"
- Se crea automáticamente el usuario en la base de datos
- Redirección automática al dashboard

### 2. **Inicio de Sesión con Credenciales**

- Completa el formulario con email y contraseña
- Validación en tiempo real
- Redirección después del login exitoso

### 3. **Registro de Nuevo Usuario**

- Completa todos los campos obligatorios
- Selecciona localidad desde la base de datos
- El sistema crea automáticamente el usuario en todas las tablas
- Auto-login después del registro exitoso

### 4. **Cambio de Método**

- Usa los tabs para cambiar entre métodos de autenticación
- Navegación fluida entre login y registro

## Estructura de Archivos

```
src/
├── components/auth/
│   ├── GoogleSignInButton.tsx    # Botón de Google
│   ├── CredentialsForm.tsx       # Formulario de credenciales
│   ├── RegistrationForm.tsx      # Formulario de registro completo
│   └── Divider.tsx               # Separador visual
├── app/
│   ├── (auth)/
│   │   ├── signin/
│   │   │   └── page.tsx          # Página de login
│   │   └── signup/
│   │       └── page.tsx          # Página de registro
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/
│       │   │   └── route.ts      # API de NextAuth
│       │   └── register/
│       │       └── route.ts      # API de registro
│       └── localidades/
│           └── route.ts          # API de localidades
├── hooks/
│   └── useAuth.ts                # Hook personalizado de autenticación
├── types/
│   └── auth.ts                   # Tipos TypeScript para NextAuth
├── utilities/auth/
│   └── authOptions.ts            # Configuración de NextAuth con Prisma
└── DB/
    └── prisma.ts                 # Cliente de Prisma
```

## APIs Implementadas

### POST `/api/auth/register`

Registra un nuevo usuario en el sistema.

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
	"password": "string"
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

Obtiene todas las localidades disponibles para el formulario de registro.

**Respuesta:**

```json
[
	{
		"Id": "number",
		"Descripcion": "string"
	}
]
```

## Próximos Pasos

1. **Configurar las variables de entorno**
2. **Crear las credenciales de Google OAuth**
3. **Verificar la conexión a la base de datos**
4. **Probar ambos métodos de autenticación**
5. **Probar el sistema de registro completo**
6. **Personalizar el diseño según tus necesidades**
7. **Implementar validaciones adicionales si es necesario**

## Notas Importantes

- **Seguridad**: Asegúrate de que `NEXTAUTH_SECRET` y `NEXTAUTH_JWT_SECRET` sean diferentes y seguras
- **Base de Datos**: El sistema requiere que las tablas Persona, Persona_Empleado y Usuario existan
- **Localidades**: El sistema carga dinámicamente las localidades desde la base de datos
- **Transacciones**: El registro usa transacciones para garantizar consistencia de datos
- **Google OAuth**: Los usuarios de Google se crean automáticamente en la base de datos
- **Producción**: En producción, usa URLs HTTPS para las redirecciones de Google
- **Validaciones**: Considera implementar validaciones adicionales según tus necesidades de negocio

## Dependencias Instaladas

```bash
npm install @auth/prisma-adapter bcryptjs @types/bcryptjs
```

## Solución de Problemas

### Error de Conexión a Base de Datos

- Verifica que `DATABASE_URL` esté configurado correctamente
- Asegúrate de que Prisma esté generado: `npm run prisma:generate`

### Error de Google OAuth

- Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén configurados
- Confirma que las URLs de redirección estén correctas en Google Cloud Console

### Error de Registro

- Verifica que todas las tablas existan en la base de datos
- Confirma que los campos obligatorios estén completos
- Revisa los logs del servidor para errores específicos

### Error de Serialización BigInt

- **Problema**: `TypeError: Do not know how to serialize a BigInt`
- **Causa**: Prisma devuelve campos ID como BigInt, que no se pueden serializar a JSON
- **Solución**: Usar la función `serializeBigInt()` para convertir BigInt a Number antes de enviar respuestas
- **Archivos afectados**: Todas las APIs que devuelven datos de Prisma con IDs
