import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/DB/prisma";
import bcrypt from "bcryptjs";

// Variables de entorno requeridas para NextAuth (solo credenciales)
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error("[authOptions] Variables de entorno faltantes:", missingVars);
  console.error("Configura estas variables en tu archivo .env.local o .env");
}

const authSecret = process.env.NEXTAUTH_SECRET;
const jwtSecret = process.env.NEXTAUTH_JWT_SECRET || authSecret;

export const authOptions: AuthOptions = {
  providers: [
    // Unico proveedor: credenciales internas
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: {
          label: "email",
          type: "text",
        },
        password: {
          label: "password",
          type: "password",
        },
      },
      // Autenticación básica contra la tabla Usuario + Persona asociada
      async authorize(credentials) {
        try {
          if (!credentials) {
            throw new Error("Credenciales indefinidas");
          }

          const email = credentials.email?.trim().toLowerCase();
          const password = credentials.password;

          // Busca al usuario por email (Persona) y verifica que no esté eliminado/bloqueado y pertenezca al tenant
          const usuario = await prisma.usuario.findFirst({
            where: {
              // TenantId: tenantId,
              Persona_Empleado: {
                Persona: {
                  Mail: email,
                  EstaEliminado: false,
                  // TenantId: tenantId,
                },
              },
              EstaEliminado: false,
              EstaBloqueado: false,
            },
            include: {
              Persona_Empleado: {
                include: {
                  Persona: true,
                },
              },
              Tenant: true,
            },
          });

          if (!usuario) {
            throw new Error("Usuario no encontrado");
          }

          // Comparación segura del hash almacenado
          const isValidPassword = await bcrypt.compare(
            password,
            usuario.Password
          );

          if (!isValidPassword) {
            throw new Error("Contrasena incorrecta");
          }

          return {
            id: usuario.Id.toString(),
            name: usuario.Persona_Empleado.Persona.Nombre,
            email: usuario.Persona_Empleado.Persona.Mail,
            image: "",
            roll: "Empleado",
            tenantId: usuario.Tenant.Id.toString(),
          };
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    error: "/signin",
    // Registro deshabilitado: no se expone página de alta
  },
  session: {
    maxAge: 28800,
    strategy: "jwt",
  },
  jwt: {
    secret: jwtSecret,
  },
  secret: authSecret,
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    // Propaga rol y permite actualización de nombre vía trigger "update"
    async jwt({ token, user, session, trigger }) {
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }

      if (user) {
        return {
          ...token,
          roll: user.roll,
          tenantId: user.tenantId,
        };
      }

      return token;
    },
    // Expone el rol en la sesión del lado cliente
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          roll: token.roll,
          tenantId: token.tenantId,
        },
      };
    },
  },
};
