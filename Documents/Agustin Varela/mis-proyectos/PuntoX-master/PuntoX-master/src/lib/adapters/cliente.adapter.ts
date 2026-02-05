import { Cliente } from "@/lib/validations/cliente.schema";

export const clienteAdapter = (data: any): Cliente => {
  return {
    Id: Number(data.Id),
    Nombre: data.Nombre,
    Apellido: data.Apellido,
    Dni: data.Dni,
    Direccion: data.Direccion,
    Telefono: data.Telefono,
    Mail: data.Mail,
    LocalidadId: Number(data.LocalidadId),
    Localidad: data.Localidad?.Descripcion ?? "",
    ProvinciaId: Number(data.Localidad?.Departamento?.Provincia?.Id),
    Provincia: data.Localidad?.Departamento?.Provincia?.Descripcion ?? "",
    DepartamentoId: Number(data.Localidad?.Departamento?.Id),
    Departamento: data.Localidad?.Departamento?.Descripcion ?? "",
    CondicionIvaId: Number(data.Persona_Cliente?.CondicionIva?.Id),
    CondicionIva: data.Persona_Cliente?.CondicionIva?.Descripcion ?? "N/A",
    ActivarCtaCte: Boolean(data.Persona_Cliente?.ActivarCtaCte),
    TieneLimiteCompra: Boolean(data.Persona_Cliente?.TieneLimiteCompra),
    MontoMaximoCtaCte: Number(data.Persona_Cliente?.MontoMaximoCtaCte || 0),
  };
};

export const clienteListAdapter = (data: any[]): Cliente[] => {
  if (!Array.isArray(data)) return [];
  return data.map(clienteAdapter);
};
