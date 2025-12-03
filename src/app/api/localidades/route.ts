import { NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { serializeBigIntArray } from "@/utilities/serialization";

export async function GET() {
	try {
		const localidades = await prisma.localidad.findMany({
			where: {
				EstaEliminado: false,
			},
			select: {
				Id: true,
				Descripcion: true,
			},
			orderBy: [
				{
					Descripcion: "asc",
				},
			],
		});

		// Serializar BigInt a Number usando la función utilitaria
		const localidadesSerializadas = serializeBigIntArray(localidades);

		console.log(localidadesSerializadas);
		return NextResponse.json(localidadesSerializadas);
	} catch (error) {
		console.error("Error al obtener localidades:", error);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 }
		);
	}
}
