import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import bcrypt from "bcryptjs";
import { serializeBigInt } from "@/utilities/serialization";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			apellido,
			nombre,
			dni,
			direccion,
			telefono,
			mail,
			localidadId,
			nombreUsuario,
			password,
		} = body;

		// Validaciones básicas
		if (
			!apellido ||
			!nombre ||
			!direccion ||
			!mail ||
			!localidadId ||
			!nombreUsuario ||
			!password
		) {
			return NextResponse.json(
				{ error: "Todos los campos obligatorios son requeridos" },
				{ status: 400 }
			);
		}

		// Verificar si el email ya existe
		const existingPersona = await prisma.persona.findFirst({
			where: {
				Mail: mail,
				EstaEliminado: false,
			},
		});

		if (existingPersona) {
			return NextResponse.json(
				{ error: "El correo electrónico ya está registrado" },
				{ status: 400 }
			);
		}

		// Verificar si el nombre de usuario ya existe
		const existingUsuario = await prisma.usuario.findFirst({
			where: {
				Nombre: nombreUsuario,
				EstaEliminado: false,
			},
		});

		if (existingUsuario) {
			return NextResponse.json(
				{ error: "El nombre de usuario ya está en uso" },
				{ status: 400 }
			);
		}

		// Hash de la contraseña
		const hashedPassword = await bcrypt.hash(password, 12);

		// Crear transacción para insertar en todas las tablas
		const result = await prisma.$transaction(async (tx) => {
			// 1. Crear Persona
			const persona = await tx.persona.create({
				data: {
					Apellido: apellido,
					Nombre: nombre,
					Dni: dni || null,
					Direccion: direccion,
					Telefono: telefono || null,
					Mail: mail,
					LocalidadId: BigInt(localidadId),
					EstaEliminado: false,
				},
			});

			// 2. Crear Persona_Empleado
			const personaEmpleado = await tx.persona_Empleado.create({
				data: {
					Id: persona.Id,
					Legajo: Math.floor(Math.random() * 10000) + 1000, // Generar legajo aleatorio
					Foto: Buffer.alloc(0), // Foto vacía por defecto
				},
			});

			// 3. Crear Usuario
			const usuario = await tx.usuario.create({
				data: {
					EmpleadoId: personaEmpleado.Id,
					Nombre: nombreUsuario,
					Password: hashedPassword,
					EstaBloqueado: false,
					EstaEliminado: false,
				},
			});

			return {
				persona,
				personaEmpleado,
				usuario,
			};
		});

		// Serializar los IDs BigInt antes de enviar la respuesta
		const response = {
			message: "Usuario registrado exitosamente",
			userId: Number(result.usuario.Id),
			personaId: Number(result.persona.Id),
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("Error en el registro:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
