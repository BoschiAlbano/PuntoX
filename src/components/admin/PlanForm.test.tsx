/**
 * Formulario de planes: los límites son campos reales con opción
 * "Ilimitado" (null) en lugar de un JSON escrito a mano.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PlanForm, { type Plan } from "./PlanForm";

const planBasico: Plan = {
  Id: 2,
  Nombre: "Plan Básico",
  Descripcion: "",
  CostoMensual: 25000,
  Limites: { maxSucursales: 1, maxUsuarios: 3, maxArticulos: 1000, incluyeAFIP: true },
  CantidadTenants: 1,
};

const abrir = (initialData?: Plan) => {
  const onSubmit = vi.fn();
  render(
    <PlanForm
      isOpen
      onClose={vi.fn()}
      initialData={initialData}
      onSubmit={onSubmit}
      isSaving={false}
    />,
  );
  return onSubmit;
};

const guardar = () =>
  fireEvent.click(screen.getByRole("button", { name: /guardar cambios|crear plan/i }));

describe("PlanForm", () => {
  it("carga los límites del plan y los envía como números", () => {
    const onSubmit = abrir(planBasico);
    expect(screen.getByRole("spinbutton", { name: /^Usuarios/ })).toHaveValue(3);
    guardar();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ Id: 2, Limites: planBasico.Limites }),
    );
  });

  it("'Ilimitado' envía null", () => {
    const onSubmit = abrir(planBasico);
    fireEvent.click(screen.getByRole("switch", { name: /artículos ilimitado/i }));
    guardar();
    expect(onSubmit.mock.calls[0][0].Limites.maxArticulos).toBeNull();
  });

  it("no deja guardar un límite vacío o en 0", () => {
    const onSubmit = abrir(planBasico);
    fireEvent.change(screen.getByRole("spinbutton", { name: /^Usuarios/ }), { target: { value: "0" } });
    expect(screen.getByText("Tiene que ser al menos 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeDisabled();
    guardar();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("permite quitar ARCA del plan", () => {
    const onSubmit = abrir(planBasico);
    fireEvent.click(screen.getByRole("switch", { name: /facturación electrónica arca/i }));
    guardar();
    expect(onSubmit.mock.calls[0][0].Limites.incluyeAFIP).toBe(false);
  });
});
