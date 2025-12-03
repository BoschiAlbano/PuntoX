/**
 * Función para convertir BigInt a Number en objetos
 * Útil para serializar datos de Prisma que contienen BigInt
 */
export function serializeBigInt<T extends Record<string, any>>(obj: T): T {
	const serialized = { ...obj };

	for (const key in serialized) {
		if (typeof serialized[key] === "bigint") {
			serialized[key] = Number(serialized[key]);
		} else if (
			typeof serialized[key] === "object" &&
			serialized[key] !== null
		) {
			serialized[key] = serializeBigInt(serialized[key]);
		}
	}

	return serialized;
}

/**
 * Función para convertir un array de objetos que contienen BigInt
 */
export function serializeBigIntArray<T extends Record<string, any>>(
	arr: T[]
): T[] {
	return arr.map((item) => serializeBigInt(item));
}
