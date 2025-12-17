import { describe, it, expect } from "vitest";
import { serializeBigInt, serializeBigIntArray } from "./serialization";

describe("serialization", () => {
  describe("serializeBigInt", () => {
    it("debe convertir BigInt a Number en objetos anidados", () => {
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

      const serialized = serializeBigInt(testData);

      expect(typeof serialized.id).toBe("number");
      expect(serialized.id).toBe(123456789);
      expect(typeof serialized.details.userId).toBe("number");
      expect(serialized.details.userId).toBe(987654321);
      expect(typeof serialized.details.metadata.createdAt).toBe("number");
      expect(serialized.details.metadata.createdAt).toBe(1640995200000);
      expect(serialized.name).toBe("Test User");
      expect(serialized.details.active).toBe(true);
    });

    it("debe manejar objetos sin BigInt", () => {
      const testData = {
        name: "Test",
        active: true,
        count: 42,
      };

      const serialized = serializeBigInt(testData);

      expect(serialized).toEqual(testData);
    });
  });

  describe("serializeBigIntArray", () => {
    it("debe convertir BigInt a Number en arrays de objetos", () => {
      const testArray = [
        { id: BigInt(1), name: "Item 1" },
        { id: BigInt(2), name: "Item 2" },
        { id: BigInt(3), name: "Item 3" },
      ];

      const serialized = serializeBigIntArray(testArray);

      expect(Array.isArray(serialized)).toBe(true);
      expect(serialized.length).toBe(3);
      expect(typeof serialized[0].id).toBe("number");
      expect(serialized[0].id).toBe(1);
      expect(typeof serialized[1].id).toBe("number");
      expect(serialized[1].id).toBe(2);
      expect(typeof serialized[2].id).toBe("number");
      expect(serialized[2].id).toBe(3);
    });

    it("debe manejar arrays vacíos", () => {
      const emptyArray: any[] = [];
      const serialized = serializeBigIntArray(emptyArray);

      expect(Array.isArray(serialized)).toBe(true);
      expect(serialized.length).toBe(0);
    });
  });
});
