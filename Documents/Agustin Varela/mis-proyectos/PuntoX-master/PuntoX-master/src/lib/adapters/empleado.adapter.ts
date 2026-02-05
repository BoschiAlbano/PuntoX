import { Empleado } from "@/hooks/useEmpleados";

/**
 * Adapta la respuesta de la API de empleados al formato esperado por el frontend
 */
export const empleadoAdapter = (data: any): Empleado => {
  return {
    id: Number(data.id || data.Id),
    personaId: Number(data.personaId || data.PersonaId),
    usuarioId: data.usuarioId ? Number(data.usuarioId) : null,
    nombre: data.nombre || data.Nombre || "",
    apellido: data.apellido || data.Apellido || "",
    nombreCompleto: data.nombreCompleto || `${data.nombre || ""} ${data.apellido || ""}`.trim(),
    email: data.email || data.Mail || data.mail || "",
    username: data.username || data.nombreUsuario || data.NombreUsuario || null,
    telefono: data.telefono || data.Telefono || null,
    direccion: data.direccion || data.Direccion || null,
    localidadId: data.localidadId ? Number(data.localidadId) : null,
    localidad: data.localidad || data.Localidad || null,
    departamentoId: data.departamentoId ? Number(data.departamentoId) : null,
    provinciaId: data.provinciaId ? Number(data.provinciaId) : null,
    rolId: data.rolId ? Number(data.rolId) : null,
    rolNombre: data.rolNombre || null,
    rolTipo: data.rolTipo || null,
    estado: data.estado || "Activo",
    legajo: data.legajo || null,
    dni: data.dni || data.Dni || null,
    ultimaActividad: data.ultimaActividad || null,
  };
};

export const empleadoListAdapter = (data: any[]): Empleado[] => {
  if (!Array.isArray(data)) return [];
  return data.map(empleadoAdapter);
};

