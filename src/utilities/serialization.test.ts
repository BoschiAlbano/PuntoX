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
// Logs de depuración eliminados durante la limpieza.

// Verificar que los BigInt se convirtieron a Number
const serialized = serializeBigInt(testData);
// Puedes añadir aserciones aquí según sea necesario para las pruebas
