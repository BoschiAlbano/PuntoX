/**
 * Tests para la función debounce
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce } from "@/lib/utils/debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debe ejecutar la función después del tiempo de espera", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("debe cancelar la ejecución anterior si se llama de nuevo antes del tiempo de espera", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn();
    vi.advanceTimersByTime(50);
    
    expect(mockFn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("debe pasar los argumentos correctamente a la función", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn("arg1", "arg2", 123);
    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", 123);
  });

  it("debe manejar múltiples llamadas independientes", () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);

    debouncedFn();
    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("debe funcionar con diferentes tiempos de espera", () => {
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();
    const debouncedFn1 = debounce(mockFn1, 50);
    const debouncedFn2 = debounce(mockFn2, 200);

    debouncedFn1();
    debouncedFn2();

    vi.advanceTimersByTime(50);
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });
});
