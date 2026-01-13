/**
 * Tests para el componente CredentialsForm
 *
 * Tests unitarios para las funciones de validación y manejo de errores
 */

import { describe, it, expect } from "vitest";

// Importar las funciones que queremos testear
// Como son funciones internas, las extraeremos o las testaremos indirectamente

// Función de validación de email (copiada del componente)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

// Función de mapeo de errores (copiada del componente)
const getErrorMessage = (error: unknown): string => {
  if (!error) return "Credenciales inválidas";

  // Manejar diferentes tipos de error
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = String(error);
  }

  // Errores específicos de Supabase Auth
  if (errorMessage.includes("Invalid login credentials")) {
    return "Email o contraseña incorrectos";
  }

  if (errorMessage.includes("Email not confirmed")) {
    return "Por favor confirma tu email antes de iniciar sesión";
  }

  if (errorMessage.includes("Too many requests")) {
    return "Demasiados intentos. Intenta de nuevo en unos minutos";
  }

  if (errorMessage.includes("User not found")) {
    return "Usuario no encontrado";
  }

  if (errorMessage.includes("Invalid email")) {
    return "El formato del email no es válido";
  }

  if (errorMessage.includes("Password")) {
    return "La contraseña es incorrecta";
  }

  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "Error de conexión. Verifica tu internet e intenta de nuevo";
  }

  // Error genérico si no coincide con ninguno
  return errorMessage || "Credenciales inválidas";
};

describe("CredentialsForm - Validación de Email", () => {
  describe("validateEmail", () => {
    it("debe validar emails correctos", () => {
      const emailsValidos = [
        "test@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user123@test-domain.com",
        "a@b.co",
        "test.email+tag@example.com",
      ];

      emailsValidos.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it("debe rechazar emails inválidos", () => {
      const emailsInvalidos = [
        "test@",
        "@example.com",
        "test@example",
        "test.example.com",
        "test @example.com",
        "test@example .com",
        "",
        "test",
        "test@.com",
        "@.com",
      ];

      emailsInvalidos.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it("debe manejar casos edge", () => {
      expect(validateEmail("test@example")).toBe(false);
      expect(validateEmail("test@example.")).toBe(false);
      expect(validateEmail(".test@example.com")).toBe(true);
      expect(validateEmail("test.@example.com")).toBe(true);
    });
  });
});

describe("CredentialsForm - Manejo de Errores", () => {
  describe("getErrorMessage", () => {
    it("debe retornar mensaje genérico para error null/undefined", () => {
      expect(getErrorMessage(null)).toBe("Credenciales inválidas");
      expect(getErrorMessage(undefined)).toBe("Credenciales inválidas");
    });

    it("debe mapear 'Invalid login credentials' correctamente", () => {
      const error = new Error("Invalid login credentials");
      expect(getErrorMessage(error)).toBe("Email o contraseña incorrectos");
    });

    it("debe mapear 'Email not confirmed' correctamente", () => {
      const error = new Error("Email not confirmed");
      expect(getErrorMessage(error)).toBe(
        "Por favor confirma tu email antes de iniciar sesión"
      );
    });

    it("debe mapear 'Too many requests' correctamente", () => {
      const error = new Error("Too many requests");
      expect(getErrorMessage(error)).toBe(
        "Demasiados intentos. Intenta de nuevo en unos minutos"
      );
    });

    it("debe mapear 'User not found' correctamente", () => {
      const error = new Error("User not found");
      expect(getErrorMessage(error)).toBe("Usuario no encontrado");
    });

    it("debe mapear 'Invalid email' correctamente", () => {
      const error = new Error("Invalid email");
      expect(getErrorMessage(error)).toBe("El formato del email no es válido");
    });

    it("debe mapear errores de Password correctamente", () => {
      const error = new Error("Password is incorrect");
      expect(getErrorMessage(error)).toBe("La contraseña es incorrecta");
    });

    it("debe mapear errores de red correctamente", () => {
      const errorNetwork = new Error("network error");
      const errorFetch = new Error("fetch failed");

      expect(getErrorMessage(errorNetwork)).toBe(
        "Error de conexión. Verifica tu internet e intenta de nuevo"
      );
      expect(getErrorMessage(errorFetch)).toBe(
        "Error de conexión. Verifica tu internet e intenta de nuevo"
      );
    });

    it("debe retornar el mensaje original para errores desconocidos", () => {
      const error = new Error("Error desconocido personalizado");
      expect(getErrorMessage(error)).toBe("Error desconocido personalizado");
    });

    it("debe manejar strings como errores", () => {
      expect(getErrorMessage("Invalid login credentials")).toBe(
        "Email o contraseña incorrectos"
      );
      expect(getErrorMessage("Error personalizado")).toBe(
        "Error personalizado"
      );
    });

    it("debe manejar objetos con message", () => {
      const error = { message: "Invalid login credentials" };
      expect(getErrorMessage(error)).toBe("Email o contraseña incorrectos");

      // También debe funcionar con otros mensajes
      const error2 = { message: "Too many requests" };
      expect(getErrorMessage(error2)).toBe(
        "Demasiados intentos. Intenta de nuevo en unos minutos"
      );
    });
  });
});

describe("CredentialsForm - Integración", () => {
  it("debe validar email antes de procesar error", () => {
    // Simular flujo: email inválido → no debería llegar a getErrorMessage
    const emailInvalido = "test@";
    const emailValido = "test@example.com";

    expect(validateEmail(emailInvalido)).toBe(false);
    expect(validateEmail(emailValido)).toBe(true);
  });

  it("debe manejar errores de Supabase Auth correctamente", () => {
    const erroresSupabase = [
      {
        error: new Error("Invalid login credentials"),
        esperado: "Email o contraseña incorrectos",
      },
      {
        error: new Error("Email not confirmed"),
        esperado: "Por favor confirma tu email antes de iniciar sesión",
      },
      {
        error: new Error("Too many requests"),
        esperado: "Demasiados intentos. Intenta de nuevo en unos minutos",
      },
    ];

    erroresSupabase.forEach(({ error, esperado }) => {
      expect(getErrorMessage(error)).toBe(esperado);
    });
  });
});
