/**
 * FunciИn para convertir BigInt a Number en objetos
 * れtil para serializar datos de Prisma que contienen BigInt
 */
export function serializeBigInt<T extends Record<string, unknown>>(obj: T): T {
	const serialized = { ...obj } as Record<string, unknown>;

	for (const key in serialized) {
		const value = serialized[key];

		if (typeof value === "bigint") {
			serialized[key] = Number(value);
		} else if (Array.isArray(value)) {
			serialized[key] = value.map((item) => {
				if (typeof item === "bigint") return Number(item);
				if (typeof item === "object" && item !== null)
					return serializeBigInt(item as Record<string, unknown>);
				return item;
			});
		} else if (typeof value === "object" && value !== null) {
			serialized[key] = serializeBigInt(value as Record<string, unknown>);
		}
	}

	return serialized as T;
}

/**
 * FunciИn para convertir un array de objetos que contienen BigInt
 */
export function serializeBigIntArray<T extends Record<string, unknown>>(
	arr: T[]
): T[] {
	return arr.map((item) => serializeBigInt(item));
}
