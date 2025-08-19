import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: AuthOptions = {
	providers: [
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
			//@ts-ignore
			async authorize(credentials, req) {
				try {
					// console.log("Credenciales: ", credentials);
					if (!credentials) {
						throw new Error(`Credenciales indefinidas..`);
					}
					const email = credentials.email;
					const password = credentials.password;

					const _Persona = {
						Nombre: "Albano",
						Mail: "boschi.albano.jose@gmail.com",
						Roll: "Admin",
						Persona_Cliente: {
							Medicamento: false,
						},
					};

					return {
						name: _Persona.Nombre,
						email: _Persona.Mail,
						image: "",
						roll: _Persona.Roll,
						medicamento: _Persona.Persona_Cliente?.Medicamento,
					};
				} catch (error) {
					throw new Error(`${error}`);
				}
			},
		}),
		GitHubProvider({
			clientId: process.env.GITHUB_ID ?? "",
			clientSecret: process.env.GITHUB_SECRET ?? "",
		}),
	],
	pages: {
		signIn: "/",
		error: "/",
	},
	session: {
		maxAge: 28800, // 3600 - 1 hora - 8hs
		strategy: "jwt",
	},
	jwt: {
		secret: process.env.NEXTAUTH_JWT_SECRET,
	},
	secret: process.env.NEXTAUTH_JWT_SECRET,
	debug: process.env.NODE_ENV !== "production",
	// callbacks: {
	//     async jwt(token, user) {
	//         if (user) {
	//             token.role = user.role;
	//         }
	//         return token;
	//     },
	//     async session(session, token) {
	//         session.user.role = token.role;
	//         return session;
	//     },
	// },
	// callbacks: {
	//     async jwt({ token, user, session, trigger }) {
	//         // console.log("JWT Callback", { token, user, session });

	//         // opcional ->  en el caso de que se quiera actualizar el token. con {update} = useSession()
	//         // podemos actualizar la base de datos tambien...
	//         if (trigger === "update" && session?.name) {
	//             token.name = session.name;
	//         }

	//         if (user) {
	//             return {
	//                 ...token,
	//                 //@ts-ignore
	//                 roll: user.roll,
	//                 //@ts-ignore
	//                 medicamento: user.medicamento,
	//             };
	//         }

	//         return token;
	//     },
	//     async session({ session, token, user }) {
	//         // console.log("Session Callback", { token, user, session });

	//         return {
	//             ...session,
	//             user: {
	//                 ...session.user,
	//                 roll: token.roll,
	//                 medicamento: token.medicamento,
	//             },
	//         };
	//     },
	// },
};
