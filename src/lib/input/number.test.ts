/**
 * Tests para handleNumberInput (solo dígitos y una coma)
 */
import { describe, it, expect, vi } from "vitest";
import { handleNumberInput } from "./number";

describe("handleNumberInput", () => {
  it("acepta dígitos y reemplaza punto por coma", () => {
    const onChange = vi.fn();
    handleNumberInput("123", onChange);
    expect(onChange).toHaveBeenCalledWith("123");
    onChange.mockClear();
    handleNumberInput("12.5", onChange);
    expect(onChange).toHaveBeenCalledWith("12,5");
  });

  it("acepta un decimal con coma", () => {
    const onChange = vi.fn();
    handleNumberInput("10,25", onChange);
    expect(onChange).toHaveBeenCalledWith("10,25");
  });

  it("no llama onChange si hay caracteres no permitidos", () => {
    const onChange = vi.fn();
    handleNumberInput("12a", onChange);
    expect(onChange).not.toHaveBeenCalled();
    handleNumberInput("12.3.4", onChange);
    expect(onChange).not.toHaveBeenCalled();
  });
});
