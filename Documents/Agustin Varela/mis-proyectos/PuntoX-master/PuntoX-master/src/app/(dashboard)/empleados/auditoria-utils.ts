export type AuditoriaRegistro = {
  accion: string;
  detalle?: string | null;
  empleado?: {
    nombre: string;
  } | null;
};

export function formatTiempoRelativo(fecha: string, now: Date = new Date()): string {
  const ahora = now;
  const fechaEvento = new Date(fecha);
  const diffMs = ahora.getTime() - fechaEvento.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Hace unos segundos";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) {
    if (diffHrs === 1) return "Hace 1h";
    return `Hace ${diffHrs}h`;
  }
  if (diffDias === 1) return "Ayer";
  if (diffDias < 7) return `Hace ${diffDias} días`;

  return fechaEvento.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export function mapearAccion(accion: string): {
  categoria: string;
  color: "default" | "primary" | "success" | "warning" | "danger";
} {
  if (accion.includes("CREAR_USUARIO") || accion.includes("REACTIVAR_USUARIO")) {
    return { categoria: "Usuarios", color: "success" };
  }
  if (accion.includes("SUSPENDER_USUARIO") || accion.includes("ELIMINAR_USUARIO")) {
    return { categoria: "Usuarios", color: "danger" };
  }
  if (
    accion.includes("CREAR_ROL") ||
    accion.includes("EDITAR_ROL") ||
    accion.includes("ASIGNAR_ROL") ||
    accion.includes("CAMBIAR_ROL")
  ) {
    return { categoria: "Roles", color: "primary" };
  }
  if (accion.includes("ELIMINAR_ROL")) {
    return { categoria: "Roles", color: "danger" };
  }
  if (accion.includes("INVITACION") || accion.includes("INVITAR")) {
    return { categoria: "Invitaciones", color: "warning" };
  }
  return { categoria: "General", color: "default" };
}

export type SeveridadColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

export function mapearSeveridad(severidad: string): SeveridadColor {
  switch (severidad) {
    case "CRITICAL":
      return "danger";
    case "WARNING":
      return "warning";
    case "INFO":
    default:
      return "primary";
  }
}

export function formatearAccion(auditoria: AuditoriaRegistro): string {
  const { accion, detalle, empleado } = auditoria;

  if (detalle) return detalle;

  switch (accion) {
    case "CREAR_USUARIO":
      return empleado ? `Nuevo usuario creado: ${empleado.nombre}` : "Nuevo usuario creado";
    case "EDITAR_USUARIO":
      return empleado ? `Usuario editado: ${empleado.nombre}` : "Usuario editado";
    case "ELIMINAR_USUARIO":
      return empleado ? `Usuario eliminado: ${empleado.nombre}` : "Usuario eliminado";
    case "SUSPENDER_USUARIO":
      return empleado ? `Usuario suspendido: ${empleado.nombre}` : "Usuario suspendido";
    case "REACTIVAR_USUARIO":
      return empleado ? `Usuario reactivado: ${empleado.nombre}` : "Usuario reactivado";
    case "INVITAR_USUARIO":
      return empleado ? `Invitación enviada a: ${empleado.nombre}` : "Invitación enviada";
    case "CREAR_ROL":
      return "Se creó un nuevo rol";
    case "EDITAR_ROL":
      return "Rol editado";
    case "ELIMINAR_ROL":
      return "Rol eliminado";
    case "ASIGNAR_ROL":
    case "CAMBIAR_ROL":
      return "Cambio de rol asignado";
    case "REENVIAR_INVITACION":
      return "Invitación reenviada";
    default:
      return accion;
  }
}
