/**
 * Tests unitarios para interpretarErrorArca (lib/services/arca.service).
 */
import { describe, it, expect } from "vitest";
import { interpretarErrorArca } from "./arca.service";

describe("interpretarErrorArca", () => {
  it("traduce el error de certificado no confiable (mismatch homologación/producción)", () => {
    const crudo =
      'ns1:cms.cert.untrusted: Certificado no emitido por AC de confianza: {"exceptionName":"gov.afip.desein.dvadac.sua.view.wsaa.LoginFault","hostname":"wsaa0.afip.gov.ar"}';
    const resultado = interpretarErrorArca(crudo);
    expect(resultado).toContain("no es válido para el entorno seleccionado");
    expect(resultado).not.toContain("LoginFault");
  });

  it("devuelve el mensaje original si no reconoce el patrón", () => {
    expect(interpretarErrorArca("Error genérico de red")).toBe(
      "Error genérico de red",
    );
  });

  it("maneja mensaje undefined sin romper", () => {
    expect(interpretarErrorArca(undefined)).toBe(
      "Error desconocido al comunicarse con ARCA",
    );
  });
});
