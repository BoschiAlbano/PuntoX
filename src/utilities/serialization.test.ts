import { serializeBigInt, serializeBigIntArray } from "./serialization";

// Pruebas para la función de serialización
const testData = {
	id: BigInt(123456789),
	name: "Test User",
	details: {
		userId: BigInt(987654321),
		active: true,
		metadata: {
			createdAt: BigInt(1640995200000),
		},
	},
};

const testArray = [
	{ id: BigInt(1), name: "Item 1" },
	{ id: BigInt(2), name: "Item 2" },
	{ id: BigInt(3), name: "Item 3" },
];

console.log("Datos originales:", testData);
console.log("Datos serializados:", serializeBigInt(testData));

console.log("Array original:", testArray);
console.log("Array serializado:", serializeBigIntArray(testArray));

// Verificar que los BigInt se convirtieron a Number
const serialized = serializeBigInt(testData);
console.log("Tipo de id:", typeof serialized.id); // Debería ser 'number'
console.log("Tipo de details.userId:", typeof serialized.details.userId); // Debería ser 'number'
console.log(
	"Tipo de details.metadata.createdAt:",
	typeof serialized.details.metadata.createdAt
); // Debería ser 'number'
