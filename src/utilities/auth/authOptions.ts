import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/DB/prisma";
import bcrypt from "bcryptjs";

// Validar variables de entorno requeridas
const requiredEnvVars = {
	NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
	NEXTAUTH_JWT_SECRET: process.env.NEXTAUTH_JWT_SECRET,
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

// Verificar que todas las variables estén definidas
const missingVars = Object.entries(requiredEnvVars)
	.filter(([_, value]) => !value)
	.map(([key]) => key);

if (missingVars.length > 0) {
	console.error("❌ Variables de entorno faltantes:", missingVars);
	console.error(
		"Por favor, configura estas variables en tu archivo .env.local"
	);
}

export const authOptions: AuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		// Solo incluir Google si las credenciales están configuradas
		...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			? [
					GoogleProvider({
						clientId: process.env.GOOGLE_CLIENT_ID,
						clientSecret: process.env.GOOGLE_CLIENT_SECRET,
					}),
			  ]
			: []),
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
			async authorize(credentials, req) {
				try {
					if (!credentials) {
						throw new Error(`Credenciales indefinidas..`);
					}
					const email = credentials.email;
					const password = credentials.password;

					// Buscar usuario por email
					const usuario = await prisma.usuario.findFirst({
						where: {
							Persona_Empleado: {
								Persona: {
									Mail: email,
									EstaEliminado: false,
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
						},
					});

					if (!usuario) {
						throw new Error("Usuario no encontrado");
					}

					// Verificar contraseña (asumiendo que está hasheada)
					const isValidPassword = await bcrypt.compare(
						password,
						usuario.Password
					);

					if (!isValidPassword) {
						throw new Error("Contraseña incorrecta");
					}

					return {
						id: usuario.Id.toString(),
						name: usuario.Persona_Empleado.Persona.Nombre,
						email: usuario.Persona_Empleado.Persona.Mail,
						image: "",
						roll: "Empleado", // Por defecto
						// medicamento: false,
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
		newUser: "/signup",
	},
	session: {
		maxAge: 28800, // 3600 - 1 hora - 8hs
		strategy: "jwt",
	},
	jwt: {
		secret: process.env.NEXTAUTH_JWT_SECRET || "fallback-secret",
	},
	secret: process.env.NEXTAUTH_SECRET || "fallback-secret",
	debug: process.env.NODE_ENV !== "production",
	callbacks: {
		async signIn({ user, account, profile }) {
			// Solo ejecutar si es login con Google y las credenciales están configuradas
			if (account?.provider === "google" && process.env.GOOGLE_CLIENT_ID) {
				try {
					const existingPersona = await prisma.persona.findFirst({
						where: {
							Mail: user.email!,
							EstaEliminado: false,
						},
						include: {
							Persona_Empleado: {
								include: {
									Usuario: true,
								},
							},
						},
					});

					// Si no existe, crear el usuario
					if (!existingPersona) {
						// Crear transacción para nuevo usuario de Google
						await prisma.$transaction(async (tx) => {
							// 1. Crear Persona
							const persona = await tx.persona.create({
								data: {
									Apellido: user.name?.split(" ").slice(1).join(" ") || "",
									Nombre: user.name?.split(" ")[0] || "",
									Dni: null,
									Direccion: "Por definir",
									Telefono: null,
									Mail: user.email!,
									LocalidadId: BigInt(1), // Localidad por defecto
									EstaEliminado: false,
								},
							});

							// 2. Crear Persona_Empleado
							const personaEmpleado = await tx.persona_Empleado.create({
								data: {
									Id: persona.Id,
									Legajo: Math.floor(Math.random() * 10000) + 1000,
									Foto: Buffer.alloc(0),
								},
							});

							// 3. Crear Usuario
							await tx.usuario.create({
								data: {
									EmpleadoId: personaEmpleado.Id,
									Nombre: user.email!.split("@")[0], // Usar parte del email como nombre de usuario
									Password: "", // Sin contraseña para usuarios de Google
									EstaBloqueado: false,
									EstaEliminado: false,
								},
							});
						});
					}
				} catch (error) {
					console.error("Error al crear usuario de Google:", error);
					return false;
				}
			}

			return true;
		},
		async jwt({ token, user, session, trigger }) {
			if (trigger === "update" && session?.name) {
				token.name = session.name;
			}

			if (user) {
				return {
					...token,
					roll: user.roll,
					// medicamento: user.medicamento,
				};
			}

			return token;
		},
		async session({ session, token, user }) {
			return {
				...session,
				user: {
					...session.user,
					roll: token.roll,
					// medicamento: token.medicamento,
				},
			};
		},
	},
};
