/**
 * Tests para el hook useTheme.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageMock).forEach((k) => delete localStorageMock[k]);
      }),
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    document.documentElement.classList.remove("dark");
  });

  it("retorna theme, setTheme, toggleTheme, isDarkMode e isInitialized", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBeDefined();
    expect(result.current.setTheme).toBeInstanceOf(Function);
    expect(result.current.toggleTheme).toBeInstanceOf(Function);
    expect(result.current.isDarkMode).toBeDefined();
    expect(result.current.isInitialized).toBeDefined();
  });

  it("setTheme actualiza el tema y guarda en localStorage", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("dark");
    });
    expect(result.current.theme).toBe("dark");
    expect(result.current.isDarkMode).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme light remueve la clase dark del documento", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("dark");
    });
    act(() => {
      result.current.setTheme("light");
    });
    expect(result.current.theme).toBe("light");
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggleTheme alterna entre light y dark", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("dark");
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe("light");
  });
});
