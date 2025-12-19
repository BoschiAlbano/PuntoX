"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Tabs,
  Tab,
  Textarea,
  Tooltip,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { Pencil, Trash2, Eye, Zap, Mail } from "lucide-react";
import Pagination, { PaginationInfo } from "@/components/common/Pagination";

// PÃ¡gina funcional de empleados: alta rÃ¡pida, roles y tabla conectada a las APIs.
type EstadoEmpleado = "Activo" | "Invitado" | "Suspendido";

type Empleado = {
  id: number;
  personaId: number;
  usuarioId: number | null;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  localidadId: number | null;
  localidad: string | null;
  departamentoId?: number | null;
  provinciaId?: number | null;
  rolId: number | null;
  rolNombre: string | null;
  rolTipo?: "ADMINISTRADOR" | "EMPLEADO" | null;
  estado: EstadoEmpleado;
  legajo: string | null;
  dni: string | null;
  ultimaActividad: string | null;
};

type Rol = {
  id: number;
  nombre: string;
  usuarios: number;
  tipo: "ADMINISTRADOR" | "EMPLEADO";
  descripcion?: string | null;
  permisos?: string[];
};

type Localidad = {
  Id: number;
  Descripcion: string;
  DepartamentoId: number;
};

type Provincia = {
  Id: number;
  Descripcion: string;
};

type Departamento = {
  Id: number;
  Descripcion: string;
  ProvinciaId: number;
};

const permisosDisponibles = [
  "Ventas",
  "Caja",
  "Clientes",
  "Productos",
  "Analiticas",
  "Configuracion",
  "Empleados",
];

function estadoColor(estado: EstadoEmpleado) {
  if (estado === "Activo") return "success";
  if (estado === "Invitado") return "warning";
  return "danger";
}

function criticidadColor(usuarios: number) {
  if (usuarios > 5) return "danger";
  if (usuarios > 0) return "warning";
  return "success";
}

function rolChipColor(tipo?: string | null) {
  if (tipo === "ADMINISTRADOR") return "secondary";
  if (tipo === "INVITADO") return "default";
  return "primary";
}

// Función para formatear tiempo relativo en español
function formatTiempoRelativo(fecha: string): string {
  const ahora = new Date();
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
  
  // Si es más de una semana, mostrar fecha
  return fechaEvento.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

// Función para mapear acción a categoría y color
function mapearAccion(accion: string): { categoria: string; color: "default" | "primary" | "success" | "warning" | "danger" } {
  if (accion.includes("CREAR_USUARIO") || accion.includes("REACTIVAR_USUARIO")) {
    return { categoria: "Usuarios", color: "success" };
  }
  if (accion.includes("SUSPENDER_USUARIO") || accion.includes("ELIMINAR_USUARIO")) {
    return { categoria: "Usuarios", color: "danger" };
  }
  if (accion.includes("CREAR_ROL") || accion.includes("EDITAR_ROL") || accion.includes("ASIGNAR_ROL") || accion.includes("CAMBIAR_ROL")) {
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

// Función para mapear severidad a color
function mapearSeveridad(severidad: string): "default" | "primary" | "secondary" | "success" | "warning" | "danger" {
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

// Función para formatear descripción de acción
function formatearAccion(auditoria: any): string {
  const { accion, detalle, empleado, usuarioAfectado } = auditoria;
  
  if (detalle) return detalle;
  
  switch (accion) {
    case "CREAR_USUARIO":
      return empleado 
        ? `Nuevo usuario creado: ${empleado.nombre}`
        : "Nuevo usuario creado";
    case "EDITAR_USUARIO":
      return empleado 
        ? `Usuario editado: ${empleado.nombre}`
        : "Usuario editado";
    case "ELIMINAR_USUARIO":
      return empleado 
        ? `Usuario eliminado: ${empleado.nombre}`
        : "Usuario eliminado";
    case "SUSPENDER_USUARIO":
      return empleado 
        ? `Usuario suspendido: ${empleado.nombre}`
        : "Usuario suspendido";
    case "REACTIVAR_USUARIO":
      return empleado 
        ? `Usuario reactivado: ${empleado.nombre}`
        : "Usuario reactivado";
    case "INVITAR_USUARIO":
      return empleado 
        ? `Invitación enviada a: ${empleado.nombre}`
        : "Invitación enviada";
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

function estadoPill(estado: EstadoEmpleado) {
  const map: Record<EstadoEmpleado, { text: string; className: string }> = {
    Activo: {
      text: "Activo",
      className: "bg-green-100 text-green-700",
    },
    Invitado: {
      text: "Invitado",
      className: "bg-yellow-100 text-yellow-700",
    },
    Suspendido: {
      text: "Suspendido",
      className: "bg-red-100 text-red-700",
    },
  };
  const cfg = map[estado];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.text}
    </span>
  );
}

export default function Empleados() {
  const { user } = useSupabaseAuthContext();
  const router = useRouter();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isLoadingAuditoria, setIsLoadingAuditoria] = useState(false);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  
  // Estado de paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [paginationAuditoria, setPaginationAuditoria] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [filtros, setFiltros] = useState({
    busqueda: "",
    rol: "todos",
    estado: "todos",
  });
  const [busquedaInput, setBusquedaInput] = useState("");
  const busquedaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    localidadId: "",
    dni: "",
    usuario: "",
    password: "",
    rolId: "",
    autoInvitar: true,
  });
  const [provinciaSeleccionada, setProvinciaSeleccionada] =
    useState<string>("");
  const [departamentoSeleccionado, setDepartamentoSeleccionado] =
    useState<string>("");

  const [nuevoRol, setNuevoRol] = useState({
    nombre: "",
    descripcion: "",
    permisos: ["Ventas", "Caja"],
    tipo: "EMPLEADO" as "ADMINISTRADOR" | "EMPLEADO",
  });

  const [openRolModal, setOpenRolModal] = useState(false);
  const [detalleEmpleado, setDetalleEmpleado] = useState<Empleado | null>(null);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<Empleado | null>(null);
  const [isSavingEmpleado, setIsSavingEmpleado] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Estado para el formulario de edición
  const [empleadoEditDraft, setEmpleadoEditDraft] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    direccion: "",
    telefono: "",
    localidadId: "",
    provinciaId: "",
    departamentoId: "",
    rolId: "",
  });
  
  // Estado para cambio de contraseña
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [rolAEliminar, setRolAEliminar] = useState<Rol | null>(null);
  const [isDeletingRol, setIsDeletingRol] = useState(false);
  const [rolAEditar, setRolAEditar] = useState<Rol | null>(null);
  const [isSavingRolEdit, setIsSavingRolEdit] = useState(false);
  const [rolEditDraft, setRolEditDraft] = useState({
    nombre: "",
    descripcion: "",
    tipo: "EMPLEADO" as "ADMINISTRADOR" | "EMPLEADO",
    permisos: [] as string[],
  });

  // Estado para almacenar si el usuario es SuperAdmin (se obtiene de la API)
  const [isSuperAdminState, setIsSuperAdminState] = useState(false);
  
  // Verificación local como fallback (basada en metadata)
  const isSuperAdminLocal =
    user?.role === "superadmin" ||
    user?.role === "SuperAdmin" ||
    (user?.app_metadata as Record<string, unknown> | undefined)?.role ===
      "SuperAdmin";
  
  // Usar el estado de la API como fuente de verdad, con fallback a la verificación local
  const isSuperAdmin = isSuperAdminState || isSuperAdminLocal;

  const resumen = useMemo(
    () => {
      const invitados = empleados.filter((e) => e.estado === "Invitado");
      return {
        activos: empleados.filter((e) => e.estado === "Activo").length,
        invitados: invitados.length,
        invitadosLista: invitados, // Lista de invitados para mostrar detalles
        suspendidos: empleados.filter((e) => e.estado === "Suspendido").length,
        roles: roles.length,
      };
    },
    [empleados, roles]
  );

  // Los filtros ahora se aplican en el backend, solo mantenemos empleados tal cual vienen
  // (el filtrado de búsqueda también se hace en backend, pero mantenemos esta variable
  // para compatibilidad con el código existente)
  // Los filtros ahora corren en el servidor, no necesitamos empleadosFiltrados

  const resolveTenantIdForRequests = () => {
    const meta = user?.app_metadata as Record<string, unknown> | undefined;
    const tenantMeta =
      (meta?.tenant_id as string | number | undefined) ?? meta?.tenantId;
    const fromUser = user?.tenantId as string | number | undefined;
    const fromEnv =
      typeof process !== "undefined"
        ? (process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID as string | undefined) ??
          (process.env.NEXT_PUBLIC_TENANT_ID as string | undefined)
        : undefined;
    const resolved = tenantMeta ?? fromUser ?? fromEnv;
    return resolved ? String(resolved) : null;
  };

  const loadData = async () => {
    setIsLoadingData(true);
    // Paso 0: verificar permisos explícitos antes de cargar todo.
    try {
      const permisosRes = await fetch("/api/permisos", {
        cache: "no-store",
      }).catch(() => null);
      if (!permisosRes || !permisosRes.ok) {
        const status = permisosRes?.status;
        if (status === 401 || status === 403) {
          setIsAuthorized(false);
          setIsLoadingData(false);
          addToast({
            title: "Sin permisos",
            description: "Necesitas empleados:admin para acceder.",
            color: "danger",
          });
          return;
        }
      } else {
        const permisosJson = await permisosRes.json().catch(() => null);
        
        // Actualizar el estado de SuperAdmin desde la API
        if (permisosJson?.isSuperAdmin === true) {
          setIsSuperAdminState(true);
        }
        
        // Opción B: Solo SuperAdmin tiene bypass automático
        // Administradores y Empleados necesitan permiso explícito "empleados:admin"
        const esSuperAdmin = permisosJson?.isSuperAdmin === true || isSuperAdminLocal;
        const tienePermisoEspecifico = Array.isArray(permisosJson?.permisos) &&
          permisosJson.permisos.includes("empleados:admin");
        
        // Solo SuperAdmin tiene acceso automático, otros necesitan permiso explícito
        const tienePermiso = esSuperAdmin || tienePermisoEspecifico;
        
        if (!tienePermiso) {
          setIsAuthorized(false);
          setIsLoadingData(false);
          addToast({
            title: "Sin permisos",
            description: "Necesitas empleados:admin para acceder.",
            color: "danger",
          });
          return;
        }
      }
    } catch {
      // Si falla, continuamos pero marcaremos no autorizado al primer 401/403.
    }

    const fallbackRoles: Rol[] = [
      {
        id: -1,
        nombre: "Administrador",
        tipo: "ADMINISTRADOR",
        usuarios: 0,
        permisos: permisosDisponibles,
      },
      {
        id: -2,
        nombre: "Empleado",
        tipo: "EMPLEADO",
        usuarios: 0,
        permisos: ["Ventas", "Caja", "Clientes"],
      },
    ];
    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      
      // Construir query para roles (sin paginación)
      const rolesQuery = tenantParam ? `?tenantId=${tenantParam}` : "";
      
      // Construir query para empleados (con paginación y filtros)
      const paginationParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (tenantParam) {
        paginationParams.append("tenantId", tenantParam);
      }
      // Agregar filtros al backend
      if (filtros.rol && filtros.rol !== "todos") {
        paginationParams.append("rol", filtros.rol);
      }
      if (filtros.estado && filtros.estado !== "todos") {
        paginationParams.append("estado", filtros.estado);
      }
      if (filtros.busqueda && filtros.busqueda.trim()) {
        paginationParams.append("busqueda", filtros.busqueda.trim());
      }
      const empleadosQuery = `?${paginationParams.toString()}`;
      
      const rolesRes = await fetch(`/api/roles${rolesQuery}`, {
        cache: "no-store",
      }).catch(() => null);
      const provRes = await fetch("/api/provincias", {
        cache: "no-store",
      }).catch(() => null);
      const empRes = await fetch(`/api/empleados${empleadosQuery}`, {
        cache: "no-store",
      }).catch(() => null);

      // Roles: si falla, cargamos fallback y seguimos.
      if (!rolesRes || !rolesRes.ok) {
        const status = rolesRes?.status;
        if (status === 401 || status === 403) {
          setIsAuthorized(false);
          setIsLoadingData(false);
          addToast({
            title: "Sin permisos",
            description: "Necesitas empleados:admin para acceder.",
            color: "danger",
          });
          return;
        }
        const rolesErr = await rolesRes?.json().catch(() => null);
        addToast({
          title: "Error al obtener roles",
          description:
            rolesErr?.error ?? "Usando roles por defecto (Admin/Empleado).",
          color: "warning",
        });
        setRoles(fallbackRoles);
      } else {
        const rolesJson = await rolesRes.json();
        const parsedRoles = Array.isArray(rolesJson?.roles)
          ? rolesJson.roles.map((rol: Rol) => ({
              ...rol,
              tipo: rol.tipo ?? "EMPLEADO",
              permisos: Array.isArray(rol.permisos) ? rol.permisos : [],
              descripcion: rol.descripcion ?? null,
              usuarios: Number(rol.usuarios ?? 0),
            }))
          : [];
        setRoles(parsedRoles.length ? parsedRoles : fallbackRoles);
      }

      // Provincias y empleados: si fallan, notificamos pero no rompemos la vista.
      if (provRes && provRes.ok) {
        const provJson = await provRes.json();
        setProvincias(Array.isArray(provJson) ? provJson : []);
      } else {
        const provErr = await provRes?.json().catch(() => null);
        addToast({
          title: "Error al obtener provincias",
          description: provErr?.error ?? "No pudimos cargar provincias.",
          color: "warning",
        });
        setProvincias([]);
      }

      if (empRes && empRes.ok) {
        const empJson = await empRes.json();
        // Manejar respuesta paginada o formato antiguo
        if (empJson?.data && empJson?.pagination) {
          setEmpleados(empJson.data);
          setPagination(empJson.pagination);
        } else if (Array.isArray(empJson?.empleados)) {
          // Formato antiguo (retrocompatibilidad)
          setEmpleados(empJson.empleados);
          setPagination({
            page: 1,
            limit: empJson.empleados.length,
            total: empJson.empleados.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        } else {
          setEmpleados([]);
        }
      } else {
        if (empRes?.status === 401 || empRes?.status === 403) {
          setIsAuthorized(false);
          setIsLoadingData(false);
          addToast({
            title: "Sin permisos",
            description: "Necesitas empleados:admin para acceder.",
            color: "danger",
          });
        } else {
          const empErr = await empRes?.json().catch(() => null);
          addToast({
            title: "Error al obtener empleados",
            description: empErr?.error ?? "No pudimos cargar empleados.",
            color: "warning",
          });
        }
        setEmpleados([]);
      }

      // No borrar departamentos y localidades si hay valores previos
      // Se recargarán automáticamente si hay provincia/departamento seleccionados
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description:
          (error as Error).message ?? "No pudimos cargar empleados y roles.",
        color: "danger",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Cargar auditorías
  const loadAuditorias = async () => {
    setIsLoadingAuditoria(true);
    try {
      const res = await fetch(
        `/api/auditoria-empleados?page=${paginationAuditoria.page}&limit=${paginationAuditoria.limit}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        if (json?.data && json?.pagination) {
          setAuditorias(json.data);
          setPaginationAuditoria(json.pagination);
        } else {
          setAuditorias([]);
        }
      } else {
        setAuditorias([]);
      }
    } catch (error) {
      console.error("Error al cargar auditorías:", error);
      setAuditorias([]);
    } finally {
      setIsLoadingAuditoria(false);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    if (busquedaTimeoutRef.current) {
      clearTimeout(busquedaTimeoutRef.current);
    }
    busquedaTimeoutRef.current = setTimeout(() => {
      setFiltros((prev) => ({ ...prev, busqueda: busquedaInput }));
      setPage(1);
    }, 500); // 500ms de delay

    return () => {
      if (busquedaTimeoutRef.current) {
        clearTimeout(busquedaTimeoutRef.current);
      }
    };
  }, [busquedaInput]);

  useEffect(() => {
    if (user) {
      loadData();
      loadAuditorias();
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [page, limit, filtros.rol, filtros.estado, filtros.busqueda]);

  const loadDepartamentos = async (provId: string, q?: string) => {
    if (!provId) {
      setDepartamentos([]);
      return;
    }
    try {
      const res = await fetch(`/api/departamentos?provinciaId=${provId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        addToast({
          title: "Error",
          description: err?.error ?? "No se pudieron cargar departamentos",
          color: "warning",
        });
        setDepartamentos([]);
        return;
      }
      const data = await res.json();
      setDepartamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setDepartamentos([]);
      addToast({
        title: "Error",
        description: "No se pudieron cargar departamentos",
        color: "warning",
      });
    }
  };

  const loadLocalidades = async (deptId: string) => {
    if (!deptId) {
      setLocalidades([]);
      return;
    }
    try {
      const res = await fetch(`/api/localidades?departamentoId=${deptId}`);
      if (!res.ok) throw new Error("No se pudieron cargar localidades");
      const data = await res.json();
      setLocalidades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setLocalidades([]);
    }
  };

  useEffect(() => {
    if (provinciaSeleccionada) {
      loadDepartamentos(provinciaSeleccionada);
      setDepartamentoSeleccionado("");
      setLocalidades([]);
      setNuevoUsuario((prev) => ({ ...prev, localidadId: "" }));
    } else {
      setDepartamentos([]);
      setLocalidades([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinciaSeleccionada]);

  useEffect(() => {
    if (departamentoSeleccionado) {
      loadLocalidades(departamentoSeleccionado);
      setNuevoUsuario((prev) => ({ ...prev, localidadId: "" }));
    } else {
      setLocalidades([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departamentoSeleccionado]);

  // Recargar selects de ubicación después de loadData si hay valores previos
  // Se dispara cuando termina la carga o cambia la página
  useEffect(() => {
    if (!isLoadingData) {
      if (provinciaSeleccionada && departamentos.length === 0) {
        loadDepartamentos(provinciaSeleccionada);
      }
      if (departamentoSeleccionado && localidades.length === 0) {
        loadLocalidades(departamentoSeleccionado);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingData, page]);

  const handleCrearUsuario = async () => {
    if (
      !nuevoUsuario.nombre.trim() ||
      !nuevoUsuario.apellido.trim() ||
      !nuevoUsuario.email.trim() ||
      !nuevoUsuario.usuario.trim() ||
      !nuevoUsuario.password.trim() ||
      !nuevoUsuario.direccion.trim() ||
      !provinciaSeleccionada ||
      !departamentoSeleccionado ||
      !nuevoUsuario.localidadId
    ) {
      addToast({
        title: "Faltan datos",
        description: "Completa los campos obligatorios para crear el usuario.",
        color: "warning",
      });
      return;
    }

    setIsSavingUser(true);
    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      const tenantQuery = tenantParam ? `?tenantId=${tenantParam}` : "";

      const body = {
        nombre: nuevoUsuario.nombre.trim(),
        apellido: nuevoUsuario.apellido.trim(),
        mail: nuevoUsuario.email.trim(),
        telefono: nuevoUsuario.telefono || null,
        direccion: nuevoUsuario.direccion.trim(),
        localidadId: Number(nuevoUsuario.localidadId),
        departamentoId: departamentoSeleccionado
          ? Number(departamentoSeleccionado)
          : null,
        provinciaId: provinciaSeleccionada
          ? Number(provinciaSeleccionada)
          : null,
        dni: nuevoUsuario.dni || null,
        nombreUsuario: nuevoUsuario.usuario.trim(),
        password: nuevoUsuario.password,
        rolId: nuevoUsuario.rolId ? Number(nuevoUsuario.rolId) : undefined,
        autoInvitar: nuevoUsuario.autoInvitar,
      };

      const res = await fetch(`/api/empleados${tenantQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errorMessage = data?.error ?? "No se pudo crear el usuario";
        
        // Detectar errores específicos de correo duplicado
        if (
          errorMessage.toLowerCase().includes("correo") &&
          (errorMessage.toLowerCase().includes("registrado") ||
           errorMessage.toLowerCase().includes("existe") ||
           errorMessage.toLowerCase().includes("duplicado"))
        ) {
          addToast({
            title: "Correo ya registrado",
            description: "Este correo ya se encuentra registrado. Por favor, usa otro correo electrónico.",
            color: "warning",
          });
          setIsSavingUser(false);
          return;
        }
        
        // Detectar errores de nombre de usuario duplicado
        if (
          errorMessage.toLowerCase().includes("usuario") &&
          (errorMessage.toLowerCase().includes("en uso") ||
           errorMessage.toLowerCase().includes("duplicado"))
        ) {
          addToast({
            title: "Usuario ya en uso",
            description: "Este nombre de usuario ya está en uso. Por favor, elige otro.",
            color: "warning",
          });
          setIsSavingUser(false);
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();
      
      addToast({
        title: "Usuario creado",
        description: nuevoUsuario.autoInvitar
          ? "Se envió la invitación. Podrás ajustar permisos desde roles."
          : "Usuario listo. Recuerda compartir las credenciales.",
        color: "success",
      });

      // Recargar datos para actualizar la lista y conteos
      await loadData();
      // Recargar auditorías para mostrar la acción recién registrada
      await loadAuditorias();

      setNuevoUsuario({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        direccion: "",
        localidadId: "",
        dni: "",
        usuario: "",
        password: "",
        rolId: "",
        autoInvitar: true,
      });
      setProvinciaSeleccionada("");
      setDepartamentoSeleccionado("");
      setLocalidades([]);
      setDepartamentos([]);
    } catch (error) {
      console.error(error);
      const errorMessage = (error as Error).message;
      
      // Verificar si el error es de Supabase relacionado con correo duplicado
      if (
        errorMessage.toLowerCase().includes("supabase") &&
        (errorMessage.toLowerCase().includes("correo") ||
         errorMessage.toLowerCase().includes("email") ||
         errorMessage.toLowerCase().includes("duplicate") ||
         errorMessage.toLowerCase().includes("already exists"))
      ) {
        addToast({
          title: "Correo ya registrado",
          description: "Este correo ya se encuentra registrado. Por favor, usa otro correo electrónico.",
          color: "warning",
        });
      } else {
        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleCrearRol = async () => {
    if (!nuevoRol.nombre.trim()) {
      addToast({
        title: "Nombre requerido",
        description: "Define un nombre para el rol.",
        color: "warning",
      });
      return;
    }

    if (!nuevoRol.permisos.length) {
      addToast({
        title: "Selecciona permisos",
        description: "El rol debe tener al menos un permiso.",
        color: "warning",
      });
      return;
    }

    setIsSavingRole(true);
    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      const tenantQuery = tenantParam ? `?tenantId=${tenantParam}` : "";
      const res = await fetch(`/api/roles${tenantQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoRol.nombre,
          descripcion: nuevoRol.descripcion,
          tipo: nuevoRol.tipo,
          permisos: nuevoRol.permisos,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo crear el rol");
      }

      const data = await res.json();

      addToast({
        title: "Rol creado",
        description: "Asignalo desde la tabla o en el alta rapida.",
        color: "success",
      });

      // Recargar datos para actualizar roles y conteos
      await loadData();
      // Recargar auditorías para mostrar la acción recién registrada
      await loadAuditorias();
      setOpenRolModal(false);
      setNuevoRol({
        nombre: "",
        descripcion: "",
        permisos: ["Ventas", "Caja"],
        tipo: "EMPLEADO",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleEditarRol = async () => {
    if (!rolAEditar) return;

    if (!rolEditDraft.nombre.trim()) {
      addToast({
        title: "Nombre requerido",
        description: "Define un nombre para el rol.",
        color: "warning",
      });
      return;
    }

    if (!rolEditDraft.permisos.length) {
      addToast({
        title: "Selecciona permisos",
        description: "El rol debe tener al menos un permiso.",
        color: "warning",
      });
      return;
    }

    setIsSavingRolEdit(true);
    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      const tenantQuery = tenantParam ? `&tenantId=${tenantParam}` : "";
      const res = await fetch(`/api/roles?id=${rolAEditar.id}${tenantQuery}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: rolEditDraft.nombre,
          descripcion: rolEditDraft.descripcion,
          tipo: rolEditDraft.tipo,
          permisos: rolEditDraft.permisos,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo actualizar el rol");
      }

      // Refrescar datos para actualizar roles y conteos
      await loadData();
      // Recargar auditorías para mostrar la acción recién registrada
      await loadAuditorias();

      addToast({
        title: "Rol actualizado",
        description: `El rol "${rolEditDraft.nombre}" fue actualizado correctamente.`,
        color: "success",
      });

      setRolAEditar(null);
      setRolEditDraft({
        nombre: "",
        descripcion: "",
        tipo: "EMPLEADO",
        permisos: [],
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
    } finally {
      setIsSavingRolEdit(false);
    }
  };

  const handleEliminarRol = async () => {
    if (!rolAEliminar) return;

    setIsDeletingRol(true);
    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      const tenantQuery = tenantParam ? `&tenantId=${tenantParam}` : "";
      const res = await fetch(`/api/roles?id=${rolAEliminar.id}${tenantQuery}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo eliminar el rol");
      }

      // Eliminar del state
      setRoles((prev) => prev.filter((r) => r.id !== rolAEliminar.id));

      // Refrescar datos para actualizar roles y conteos
      await loadData();
      // Recargar auditorías para mostrar la acción recién registrada
      await loadAuditorias();

      addToast({
        title: "Rol eliminado",
        description: `El rol "${rolAEliminar.nombre}" fue eliminado correctamente.`,
        color: "success",
      });

      setRolAEliminar(null);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
    } finally {
      setIsDeletingRol(false);
    }
  };

  const handleEstado = async (
    empleado: Empleado,
    siguiente: EstadoEmpleado
  ) => {
    if (!empleado.usuarioId) {
      addToast({
        title: "Sin usuario",
        description: "El empleado no tiene usuario asignado.",
        color: "warning",
      });
      return;
    }
    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      const tenantQuery = tenantParam ? `?tenantId=${tenantParam}` : "";

      const res = await fetch(`/api/empleados${tenantQuery}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: empleado.usuarioId,
          bloquear: siguiente === "Suspendido",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo actualizar el estado");
      }
      const data = await res.json();

      addToast({
        title: "Actualizado",
        description:
          siguiente === "Suspendido"
            ? "Usuario suspendido."
            : "Usuario activo.",
        color: "success",
      });

      // Recargar datos para actualizar la lista y conteos
      await loadData();
      // Recargar auditorías para mostrar la acción recién registrada
      await loadAuditorias();
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
    }
  };

  const handleEliminar = async (empleado: Empleado) => {
    const confirmDelete = window.confirm(
      `Eliminar definitivamente a ${empleado.nombreCompleto}? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;

    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      const tenantQuery = tenantParam ? `?tenantId=${tenantParam}` : "";
      const res = await fetch(`/api/empleados${tenantQuery}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: empleado.personaId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo eliminar el empleado");
      }

      addToast({
        title: "Empleado eliminado",
        description: `${empleado.nombreCompleto} fue eliminado.`,
        color: "success",
      });

      // Recargar datos para actualizar la lista y conteos
      await loadData();
      // Recargar auditorías para mostrar la acción recién registrada
      await loadAuditorias();
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
    }
  };

  const getRolNombre = (rolId: number | null) => {
    if (!rolId) return null;
    return roles.find((r) => r.id === rolId)?.nombre ?? null;
  };

  const getRolTipo = (rolId: number | null) => {
    if (!rolId) return null;
    return roles.find((r) => r.id === rolId)?.tipo ?? null;
  };

  // Función para editar empleado
  const handleEditarEmpleado = async () => {
    if (!empleadoAEditar) return;

    if (!empleadoEditDraft.nombre.trim() || !empleadoEditDraft.apellido.trim()) {
      addToast({
        title: "Campos requeridos",
        description: "Nombre y apellido son obligatorios.",
        color: "warning",
      });
      return;
    }

    if (!empleadoEditDraft.direccion.trim()) {
      addToast({
        title: "Dirección requerida",
        description: "La dirección es obligatoria.",
        color: "warning",
      });
      return;
    }

    if (!empleadoEditDraft.localidadId) {
      addToast({
        title: "Localidad requerida",
        description: "Debes seleccionar una localidad.",
        color: "warning",
      });
      return;
    }

    setIsSavingEmpleado(true);
    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      const tenantQuery = tenantParam ? `?tenantId=${tenantParam}` : "";

      const body: any = {
        personaId: empleadoAEditar.personaId,
      };

      if (empleadoEditDraft.nombre !== empleadoAEditar.nombre) {
        body.nombre = empleadoEditDraft.nombre.trim();
      }
      if (empleadoEditDraft.apellido !== empleadoAEditar.apellido) {
        body.apellido = empleadoEditDraft.apellido.trim();
      }
      if (empleadoEditDraft.dni !== (empleadoAEditar.dni || "")) {
        body.dni = empleadoEditDraft.dni || null;
      }
      if (empleadoEditDraft.direccion !== (empleadoAEditar.direccion || "")) {
        body.direccion = empleadoEditDraft.direccion.trim();
      }
      if (empleadoEditDraft.telefono !== (empleadoAEditar.telefono || "")) {
        body.telefono = empleadoEditDraft.telefono || null;
      }
      if (Number(empleadoEditDraft.localidadId) !== (empleadoAEditar.localidadId || null)) {
        body.localidadId = Number(empleadoEditDraft.localidadId);
      }
      if (empleadoEditDraft.provinciaId) {
        body.provinciaId = Number(empleadoEditDraft.provinciaId);
      }
      if (empleadoEditDraft.departamentoId) {
        body.departamentoId = Number(empleadoEditDraft.departamentoId);
      }
      if (empleadoEditDraft.rolId !== (empleadoAEditar.rolId ? String(empleadoAEditar.rolId) : "")) {
        body.rolId = empleadoEditDraft.rolId ? Number(empleadoEditDraft.rolId) : null;
      }

      const res = await fetch(`/api/empleados${tenantQuery}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo actualizar el empleado");
      }

      addToast({
        title: "Empleado actualizado",
        description: `${empleadoEditDraft.nombre} ${empleadoEditDraft.apellido} fue actualizado correctamente.`,
        color: "success",
      });

      // Recargar datos
      await loadData();
      // Recargar auditorías
      await loadAuditorias();
      
      setEmpleadoAEditar(null);
      setEmpleadoEditDraft({
        nombre: "",
        apellido: "",
        dni: "",
        direccion: "",
        telefono: "",
        localidadId: "",
        provinciaId: "",
        departamentoId: "",
        rolId: "",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
    } finally {
      setIsSavingEmpleado(false);
    }
  };

  // Función para cambiar contraseña
  const handleCambiarPassword = async () => {
    if (!empleadoAEditar || !empleadoAEditar.usuarioId) {
      addToast({
        title: "Error",
        description: "Usuario no encontrado",
        color: "danger",
      });
      return;
    }

    if (!nuevaPassword || nuevaPassword.length < 8) {
      addToast({
        title: "Contraseña inválida",
        description: "La contraseña debe tener al menos 8 caracteres.",
        color: "warning",
      });
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      addToast({
        title: "Contraseñas no coinciden",
        description: "Las contraseñas deben ser iguales.",
        color: "warning",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;
      const tenantQuery = tenantParam ? `?tenantId=${tenantParam}` : "";

      const res = await fetch(`/api/empleados/cambiar-password${tenantQuery}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: empleadoAEditar.usuarioId,
          nuevaPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo cambiar la contraseña");
      }

      addToast({
        title: "Contraseña actualizada",
        description: "La contraseña fue cambiada correctamente.",
        color: "success",
      });

      // Recargar auditorías
      await loadAuditorias();
      
      // Limpiar campos
      setNuevaPassword("");
      setConfirmarPassword("");
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">Sin permisos</h1>
        <p className="text-gray-600">
          Necesitas el permiso empleados:admin para acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-7xl mx-auto sm:py-8 px-0 sm:px-6 flex flex-col items-stretch justify-center">
      {/* Header de la página */}
      <section className="w-full relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-500 to-[#90c472] text-white shadow-xl mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="relative p-4 md:p-5 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Chip variant="flat" className="bg-white/10 text-white">
                Empleados
              </Chip>
              <h1 className="text-3xl md:text-[32px] font-bold">
                Gestion de Empleados
              </h1>
              <p className="text-white max-w-3xl">
                Administra tu equipo, roles, permisos y controla quien puede operar tu negocio
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs con los diferentes CRUDs */}
      <Tabs
        aria-label="Options"
        className="relative"
      >
        <Tab
          key="usuarios"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM3 5a2 2 0 11.001 3.001A2 2 0 013 5zm14 0a2 2 0 11.001 3.001A2 2 0 0117 5zm-3.707 6.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 13H13a1 1 0 100-2H9.414l1.293-1.293zM5 12a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm5-4a1 1 0 011-1h5a1 1 0 110 2h-5a1 1 0 01-1-1z" />
                </svg>
              </span>
              <span>Usuarios</span>
            </div>
          }
        >
          <Card className="shadow-none border-none bg-transparent">
            <CardBody className="p-0">
              <div className="space-y-6">
                <Card className="shadow-sm border border-slate-200">
              <CardHeader className="flex justify-between items-center pb-3">
                <div>
                  <p className="text-sm text-gray-500">Alta rápida</p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Crear usuario y asignar rol
                  </h2>
                </div>
                <Chip color="success" variant="flat" size="sm">
                  Sin costo extra
                </Chip>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre"
                    placeholder="Ej: Sofia"
                    value={nuevoUsuario.nombre}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Apellido"
                    placeholder="Ej: Romero"
                    value={nuevoUsuario.apellido}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        apellido: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Correo"
                    type="email"
                    placeholder="correo@puntox.com"
                    value={nuevoUsuario.email}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Usuario"
                    placeholder="usuario de acceso"
                    value={nuevoUsuario.usuario}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        usuario: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Contraseña"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={nuevoUsuario.password}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Telefono"
                    placeholder="+54 11 5555 0000"
                    value={nuevoUsuario.telefono}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        telefono: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Direccion"
                    placeholder="Calle y número"
                    value={nuevoUsuario.direccion}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        direccion: e.target.value,
                      }))
                    }
                  />
                  <Select
                    label="Provincia"
                    selectedKeys={
                      provinciaSeleccionada ? [provinciaSeleccionada] : []
                    }
                    onChange={(e) => setProvinciaSeleccionada(e.target.value)}
                    placeholder="Selecciona una provincia"
                  >
                    {provincias.map((prov) => (
                      <SelectItem key={String(prov.Id)}>
                        {prov.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Departamento"
                    selectedKeys={
                      departamentoSeleccionado ? [departamentoSeleccionado] : []
                    }
                    onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
                    placeholder="Selecciona un departamento"
                    isDisabled={!provinciaSeleccionada}
                  >
                    {departamentos.map((dep) => (
                      <SelectItem key={String(dep.Id)}>
                        {dep.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Localidad"
                    selectedKeys={
                      nuevoUsuario.localidadId ? [nuevoUsuario.localidadId] : []
                    }
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        localidadId: e.target.value,
                      }))
                    }
                    placeholder="Selecciona una localidad"
                    isDisabled={!departamentoSeleccionado}
                  >
                    {localidades.map((loc) => (
                      <SelectItem key={String(loc.Id)}>
                        {loc.Descripcion}
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="DNI (opcional)"
                    placeholder="12345678"
                    value={nuevoUsuario.dni}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({ ...prev, dni: e.target.value }))
                    }
                  />
                  <Select
                    label="Rol"
                    selectedKeys={nuevoUsuario.rolId ? [nuevoUsuario.rolId] : []}
                    onChange={(e) =>
                      setNuevoUsuario((prev) => ({
                        ...prev,
                        rolId: e.target.value,
                      }))
                    }
                    placeholder="Selecciona un rol"
                  >
                    {roles.map((rol) => (
                      <SelectItem key={String(rol.id)}>{rol.nombre}</SelectItem>
                    ))}
                  </Select>
                  <div className="flex items-center gap-3">
                    <Switch
                      isSelected={nuevoUsuario.autoInvitar}
                      onValueChange={(value) =>
                        setNuevoUsuario((prev) => ({ ...prev, autoInvitar: value }))
                      }
                    >
                      Enviar invitacion por correo
                    </Switch>
                    <Tooltip content="Usa plantillas del tenant para invitar rapido">
                      <span className="text-sm text-gray-500 cursor-help">?</span>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    color="primary"
                    onPress={handleCrearUsuario}
                    className="font-semibold"
                    isLoading={isSavingUser}
                    isDisabled={isLoadingData}
                  >
                    Crear usuario
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Alerta de invitaciones pendientes */}
            {resumen.invitados > 0 && (
              <Card className="shadow-sm border-2 border-yellow-300 bg-yellow-50">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📧</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900 mb-1">
                        {resumen.invitados} invitación{resumen.invitados > 1 ? "es" : ""} pendiente{resumen.invitados > 1 ? "s" : ""}
                      </h3>
                      <p className="text-sm text-yellow-700">
                        {resumen.invitadosLista
                          .map((e) => e.nombreCompleto)
                          .join(", ")}{" "}
                        {resumen.invitados > 1 ? "están" : "está"} esperando aceptar su invitación.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      color="warning"
                      onPress={() => {
                        setFiltros((prev) => ({ ...prev, estado: "Invitado" }));
                        setPage(1);
                      }}
                    >
                      Ver invitados
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            <Card className="shadow-sm border border-slate-200">
              <CardHeader className="flex flex-col gap-3 pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full">
                  <div>
                    <p className="text-sm text-gray-500">Equipo</p>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Empleados y accesos
                    </h2>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto md:items-center">
                    <Input
                      size="sm"
                      placeholder="Buscar por nombre o correo"
                      startContent={<span className="text-gray-500">🔍</span>}
                      value={busquedaInput}
                      onChange={(e) => {
                        setBusquedaInput(e.target.value);
                      }}
                      className="w-full md:max-w-xs"
                    />

                    <Select
                      size="sm"
                      selectedKeys={filtros.rol ? [filtros.rol] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFiltros((prev) => ({ ...prev, rol: selected || "" }));
                        // Resetear a página 1 al cambiar filtro de rol
                        setPage(1);
                      }}
                      className="w-full md:min-w-[160px]"
                    >
                      {[
                        <SelectItem key="todos">Todos los roles</SelectItem>,
                        ...roles.map((rol) => (
                          <SelectItem key={String(rol.id)}>
                            {rol.nombre}
                          </SelectItem>
                        )),
                      ]}
                    </Select>
                    <Select
                      size="sm"
                      selectedKeys={[filtros.estado]}
                      onChange={(e) => {
                        setFiltros((prev) => ({ ...prev, estado: e.target.value }));
                        // Resetear a página 1 al cambiar filtro de estado
                        setPage(1);
                      }}
                      className="w-full md:min-w-[160px]"
                    >
                      <SelectItem key="todos">Todos</SelectItem>
                      <SelectItem key="Activo">Activos</SelectItem>
                      <SelectItem key="Invitado">Invitados</SelectItem>
                      <SelectItem key="Suspendido">Suspendidos</SelectItem>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-3 pt-4">
                {empleados.map((empleado) => {
                  const rolNombre =
                    empleado.rolNombre ?? getRolNombre(empleado.rolId) ?? "Sin rol";
                  const rolTipo =
                    empleado.rolTipo ?? getRolTipo(empleado.rolId) ?? "Empleado";
                  return (
                    <div
                      key={empleado.usuarioId ?? empleado.personaId ?? empleado.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm sm:text-base">
                            {empleado.nombreCompleto}
                          </span>
                          <Chip
                            size="sm"
                            color={rolChipColor(rolTipo)}
                            variant="flat"
                          >
                            {rolNombre} ({rolTipo})
                          </Chip>
                        </div>
                        <p className="text-xs text-gray-500">
                          Legajo {empleado.legajo ?? "-"} ·{" "}
                          {empleado.localidad ?? "Localidad pendiente"}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">✉️</span>
                          <span>{empleado.email}</span>
                        </div>
                        <div>{estadoPill(empleado.estado)}</div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <span>⏳</span>
                          <span>
                            {empleado.estado === "Invitado"
                              ? "Invitación pendiente"
                              : empleado.ultimaActividad ?? "Pendiente"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tooltip content="Editar">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={async () => {
                              setEmpleadoAEditar(empleado);
                              // Prellenar formulario
                              const provinciaIdStr = empleado.provinciaId ? String(empleado.provinciaId) : "";
                              const departamentoIdStr = empleado.departamentoId ? String(empleado.departamentoId) : "";
                              
                              setEmpleadoEditDraft({
                                nombre: empleado.nombre,
                                apellido: empleado.apellido,
                                dni: empleado.dni || "",
                                direccion: empleado.direccion || "",
                                telefono: empleado.telefono || "",
                                localidadId: empleado.localidadId ? String(empleado.localidadId) : "",
                                provinciaId: provinciaIdStr,
                                departamentoId: departamentoIdStr,
                                rolId: empleado.rolId ? String(empleado.rolId) : "",
                              });
                              
                              // Cargar departamentos y localidades si hay provincia/departamento
                              if (provinciaIdStr) {
                                setProvinciaSeleccionada(provinciaIdStr);
                                await loadDepartamentos(provinciaIdStr);
                                if (departamentoIdStr) {
                                  setDepartamentoSeleccionado(departamentoIdStr);
                                  await loadLocalidades(departamentoIdStr);
                                }
                              }
                              
                              // Limpiar contraseñas
                              setNuevaPassword("");
                              setConfirmarPassword("");
                            }}
                          >
                            <Pencil size={16} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Ver ficha">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => setDetalleEmpleado(empleado)}
                          >
                            <Eye size={16} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Suspender/activar">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() =>
                              handleEstado(
                                empleado,
                                empleado.estado === "Suspendido"
                                  ? "Activo"
                                  : "Suspendido"
                              )
                            }
                          >
                            <Zap size={16} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Enviar email">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() =>
                              addToast({
                                title: "Invitacion reenviada",
                                description: `Enviada a ${empleado.email}`,
                                color: "success",
                              })
                            }
                          >
                            <Mail size={16} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Eliminar">
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleEliminar(empleado)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
                {empleados.length === 0 && (
                  <p className="text-sm text-gray-500 px-2 py-4 text-center">
                    {isLoadingData ? "Cargando..." : "Sin coincidencias"}
                  </p>
                )}
              </CardBody>
              
              {/* Paginación */}
              {pagination.total > 0 && (
                <div className="px-4 pb-4">
                  <Pagination
                    pagination={pagination}
                    onPageChange={(newPage) => {
                      setPage(newPage);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onLimitChange={(newLimit) => {
                      setLimit(newLimit);
                      setPage(1);
                    }}
                    showLimitSelector={true}
                  />
                </div>
              )}
            </Card>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="roles"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Roles</span>
            </div>
          }
        >
          <Card className="shadow-none border-none bg-transparent">
            <CardBody className="p-0">
              <Card className="shadow-sm border border-slate-200">
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <p className="text-sm text-gray-500">Roles</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Librería de roles
                </h3>
              </div>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={() => setOpenRolModal(true)}
              >
                + Crear rol
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4 pt-4">
              {roles.map((rol) => {
                const permisosVisibles = (
                  rol.permisos ?? permisosDisponibles
                ).slice(0, 5);
                const permisosRestantes = Math.max(
                  (rol.permisos ?? permisosDisponibles).length -
                    permisosVisibles.length,
                  0
                );
                const descripcionRol =
                  rol.tipo === "ADMINISTRADOR"
                    ? "Acceso completo a la configuración y gestión del negocio."
                    : "Puede operar ventas, caja y reportes básicos.";
                
                // Determinar si se puede eliminar el rol
                const nombreNormalizado = rol.nombre.trim().toLowerCase();
                const esRolSistema =
                  rol.id < 0 ||
                  nombreNormalizado === "administrador" ||
                  nombreNormalizado === "admin" ||
                  nombreNormalizado === "superadmin";
                const tieneUsuarios = rol.usuarios > 0;
                const puedeEliminar = !esRolSistema && !tieneUsuarios;
                
                return (
                  <div
                    key={rol.id}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col gap-3 hover:shadow-sm transition-shadow relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-900">
                          {rol.nombre}
                        </h4>
                        <Chip
                          size="sm"
                          color={rolChipColor(rol.tipo)}
                          variant="flat"
                        >
                          {rol.tipo === "ADMINISTRADOR"
                            ? "Administrador"
                            : "Empleado"}
                        </Chip>
                        <Chip
                          size="sm"
                          color={rol.usuarios > 0 ? "success" : "default"}
                          variant="flat"
                        >
                          {rol.usuarios > 0
                            ? `Asignado (${rol.usuarios})`
                            : "Sin usar"}
                        </Chip>
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-gray-100 text-gray-700"
                        >
                          👤 {rol.usuarios}{" "}
                          {rol.usuarios === 1 ? "usuario" : "usuarios"}
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="min-w-0 w-8 h-8"
                            >
                              <span className="text-lg">⋯</span>
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Acciones del rol"
                            onAction={(key) => {
                              if (key === "editar") {
                                setRolAEditar(rol);
                                setRolEditDraft({
                                  nombre: rol.nombre,
                                  descripcion: rol.descripcion ?? "",
                                  tipo: rol.tipo,
                                  permisos: rol.permisos ?? [],
                                });
                              } else if (key === "eliminar") {
                                setRolAEliminar(rol);
                              }
                            }}
                          >
                            <DropdownItem
                              key="editar"
                              startContent={<Pencil size={16} />}
                            >
                              Editar rol
                            </DropdownItem>
                            <DropdownItem
                              key="eliminar"
                              className={puedeEliminar ? "text-danger" : ""}
                              color={puedeEliminar ? "danger" : "default"}
                              isDisabled={!puedeEliminar}
                              startContent={<Trash2 size={16} />}
                              description={
                                !puedeEliminar
                                  ? tieneUsuarios
                                    ? "El rol tiene usuarios asignados"
                                    : "No se puede eliminar un rol del sistema"
                                  : undefined
                              }
                            >
                              Eliminar
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{descripcionRol}</p>
                    <div className="flex flex-wrap gap-2">
                      {permisosVisibles.map((permiso) => (
                        <span
                          key={`${rol.id}-${permiso}`}
                          className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-xs font-medium"
                        >
                          {permiso}
                        </span>
                      ))}
                      {permisosRestantes > 0 && (
                        <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-700 px-3 py-1 text-xs font-medium">
                          +{permisosRestantes} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="auditoria"
          title={
            <div className="flex items-center space-x-2">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a.75.75 0 0 1 .75.75v16.5a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10 2ZM4.5 4a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-1.5 0V4.75A.75.75 0 0 1 4.5 4Zm11 0a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-1.5 0V4.75A.75.75 0 0 1 15.5 4Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span>Auditoría de accesos</span>
            </div>
          }
        >
          <Card className="shadow-none border-none bg-transparent">
            <CardBody className="p-0">
          <Card className="mt-6 shadow-sm border border-slate-200">
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <p className="text-sm text-gray-500">Preview</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Auditoría de accesos
                </h3>
              </div>
              <Chip size="sm" variant="flat" color="warning">
                Live
              </Chip>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-4 pt-4">
              {isLoadingAuditoria ? (
                <div className="flex justify-center py-8">
                  <p className="text-sm text-gray-500">Cargando auditorías...</p>
                </div>
              ) : auditorias.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p className="text-sm text-gray-500">No hay auditorías registradas</p>
                </div>
              ) : (
                auditorias.map((aud) => {
                  const { categoria, color } = mapearAccion(aud.accion);
                  const tiempoRelativo = formatTiempoRelativo(aud.fecha);
                  const descripcion = formatearAccion(aud);
                  const severidadColor = mapearSeveridad(aud.severidad || "INFO");
                  
                  return (
                    <div key={aud.id} className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900">{descripcion}</p>
                          <Chip size="sm" color={severidadColor} variant="flat">
                            {aud.severidad || "INFO"}
                          </Chip>
                        </div>
                        <p className="text-sm text-gray-500">{tiempoRelativo}</p>
                      </div>
                      <Chip size="sm" color={color} variant="flat">
                        {categoria}
                      </Chip>
                    </div>
                  );
                })
              )}
              <Divider className="my-4" />
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    isDisabled={!paginationAuditoria.hasPreviousPage || isLoadingAuditoria}
                    onPress={() => {
                      setPaginationAuditoria((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }));
                    }}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-500">
                    Página {paginationAuditoria.page} de {paginationAuditoria.totalPages || 1}
                  </span>
                  <Button
                    size="sm"
                    variant="flat"
                    isDisabled={!paginationAuditoria.hasNextPage || isLoadingAuditoria}
                    onPress={() => {
                      setPaginationAuditoria((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }));
                    }}
                  >
                    Siguiente
                  </Button>
                </div>
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  onPress={() => router.push("/analiticas?tab=logs")}
                >
                  Ver logs completos
                </Button>
              </div>
            </CardBody>
          </Card>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>

      <Modal
        isOpen={openRolModal}
        onClose={() => setOpenRolModal(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Nuevo rol</h3>
            <p className="text-sm text-gray-500">
              Define permisos base. Luego podras afinarlos en cada usuario.
            </p>
          </ModalHeader>
          <ModalBody className="space-y-3">
            <Input
              label="Nombre"
              placeholder="Ej: Supervisor de turno"
              value={nuevoRol.nombre}
              onChange={(e) =>
                setNuevoRol((prev) => ({ ...prev, nombre: e.target.value }))
              }
            />
            <Textarea
              label="Descripcion"
              placeholder="Que puede y que no puede hacer este rol"
              value={nuevoRol.descripcion}
              onChange={(e) =>
                setNuevoRol((prev) => ({
                  ...prev,
                  descripcion: e.target.value,
                }))
              }
            />
            <Select
              label="Tipo de rol"
              selectedKeys={[nuevoRol.tipo]}
              onChange={(e) =>
                setNuevoRol((prev) => ({
                  ...prev,
                  tipo: e.target.value as "ADMINISTRADOR" | "EMPLEADO",
                }))
              }
            >
              <SelectItem key="ADMINISTRADOR">Administrador</SelectItem>
              <SelectItem key="EMPLEADO">Empleado</SelectItem>
            </Select>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Permisos</p>
              <div className="flex flex-wrap gap-2">
                {permisosDisponibles.map((permiso) => {
                  const activo = nuevoRol.permisos.includes(permiso);
                  return (
                    <Button
                      key={permiso}
                      size="sm"
                      variant={activo ? "solid" : "bordered"}
                      color={activo ? "primary" : "default"}
                      onPress={() =>
                        setNuevoRol((prev) => ({
                          ...prev,
                          permisos: activo
                            ? prev.permisos.filter((p) => p !== permiso)
                            : [...prev.permisos, permiso],
                        }))
                      }
                    >
                      {permiso}
                    </Button>
                  );
                })}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setOpenRolModal(false)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleCrearRol}
              isLoading={isSavingRole}
            >
              Crear rol
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={!!rolAEditar}
        onClose={() => {
          setRolAEditar(null);
          setRolEditDraft({
            nombre: "",
            descripcion: "",
            tipo: "EMPLEADO",
            permisos: [],
          });
        }}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Editar rol</h3>
            <p className="text-sm text-gray-500">
              Modifica los permisos y configuración del rol.
            </p>
          </ModalHeader>
          <ModalBody className="space-y-3">
            {(() => {
              const nombreNormalizado = rolAEditar?.nombre.trim().toLowerCase() ?? "";
              const esRolSistema =
                (rolAEditar?.id ?? 0) < 0 ||
                nombreNormalizado === "administrador" ||
                nombreNormalizado === "admin" ||
                nombreNormalizado === "superadmin";

              return (
                <>
                  <div>
                    <Input
                      label="Nombre"
                      placeholder="Ej: Supervisor de turno"
                      value={rolEditDraft.nombre}
                      onChange={(e) =>
                        setRolEditDraft((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      isDisabled={esRolSistema}
                    />
                    {esRolSistema && (
                      <p className="text-xs text-gray-500 mt-1">
                        Rol del sistema: el nombre no se puede modificar
                      </p>
                    )}
                  </div>
                  <Textarea
                    label="Descripcion"
                    placeholder="Que puede y que no puede hacer este rol"
                    value={rolEditDraft.descripcion}
                    onChange={(e) =>
                      setRolEditDraft((prev) => ({
                        ...prev,
                        descripcion: e.target.value,
                      }))
                    }
                  />
                  <div>
                    <Select
                      label="Tipo de rol"
                      selectedKeys={[rolEditDraft.tipo]}
                      onChange={(e) =>
                        setRolEditDraft((prev) => ({
                          ...prev,
                          tipo: e.target.value as "ADMINISTRADOR" | "EMPLEADO",
                        }))
                      }
                      isDisabled={esRolSistema}
                    >
                      <SelectItem key="ADMINISTRADOR">Administrador</SelectItem>
                      <SelectItem key="EMPLEADO">Empleado</SelectItem>
                    </Select>
                    {esRolSistema && (
                      <p className="text-xs text-gray-500 mt-1">
                        Rol del sistema: el tipo no se puede modificar
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">Permisos</p>
                    <div className="flex flex-wrap gap-2">
                      {permisosDisponibles.map((permiso) => {
                        const activo = rolEditDraft.permisos.includes(permiso);
                        return (
                          <Button
                            key={permiso}
                            size="sm"
                            variant={activo ? "solid" : "bordered"}
                            color={activo ? "primary" : "default"}
                            onPress={() =>
                              setRolEditDraft((prev) => ({
                                ...prev,
                                permisos: activo
                                  ? prev.permisos.filter((p) => p !== permiso)
                                  : [...prev.permisos, permiso],
                              }))
                            }
                          >
                            {permiso}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  {(() => {
                    const nombreNormalizadoEdit = rolAEditar?.nombre.trim().toLowerCase() ?? "";
                    const esRolSistemaEdit =
                      (rolAEditar?.id ?? 0) < 0 ||
                      nombreNormalizadoEdit === "administrador" ||
                      nombreNormalizadoEdit === "admin" ||
                      nombreNormalizadoEdit === "superadmin";
                    const tieneUsuariosEdit = (rolAEditar?.usuarios ?? 0) > 0;
                    const puedeEliminarEdit = !esRolSistemaEdit && !tieneUsuariosEdit;

                    return (
                      <div className="pt-4 border-t border-slate-200">
                        <Tooltip
                          content={
                            !puedeEliminarEdit
                              ? tieneUsuariosEdit
                                ? "El rol tiene usuarios asignados"
                                : "No se puede eliminar un rol del sistema"
                              : "Eliminar este rol permanentemente"
                          }
                        >
                          <Button
                            color="danger"
                            variant="flat"
                            className="w-full"
                            isDisabled={!puedeEliminarEdit}
                            onPress={() => {
                              setRolAEditar(null);
                              setRolAEliminar(rolAEditar);
                              setRolEditDraft({
                                nombre: "",
                                descripcion: "",
                                tipo: "EMPLEADO",
                                permisos: [],
                              });
                            }}
                          >
                            Eliminar rol
                          </Button>
                        </Tooltip>
                      </div>
                    );
                  })()}
                </>
              );
            })()}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setRolAEditar(null);
                setRolEditDraft({
                  nombre: "",
                  descripcion: "",
                  tipo: "EMPLEADO",
                  permisos: [],
                });
              }}
              isDisabled={isSavingRolEdit}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleEditarRol}
              isLoading={isSavingRolEdit}
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={!!detalleEmpleado}
        onClose={() => setDetalleEmpleado(null)}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">
              {detalleEmpleado?.nombreCompleto ?? "Empleado"}
            </h3>
            <p className="text-sm text-gray-500">{detalleEmpleado?.email}</p>
          </ModalHeader>
          <ModalBody className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rol</span>
              <Chip size="sm">
                {detalleEmpleado?.rolNombre ??
                  getRolNombre(detalleEmpleado?.rolId ?? null) ??
                  "Sin rol"}{" "}
                ·{" "}
                {detalleEmpleado?.rolTipo ??
                  getRolTipo(detalleEmpleado?.rolId ?? null) ??
                  "Empleado"}
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado</span>
              <Chip
                size="sm"
                color={
                  detalleEmpleado
                    ? estadoColor(detalleEmpleado.estado)
                    : "default"
                }
                variant="flat"
              >
                {detalleEmpleado?.estado}
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Legajo</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.legajo ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Localidad</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.localidad ?? "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Telefono</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.telefono ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Direccion</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.direccion ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ultima actividad</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.estado === "Invitado"
                  ? "Invitación pendiente"
                  : detalleEmpleado?.ultimaActividad ?? "Pendiente"}
              </span>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDetalleEmpleado(null)}>
              Cerrar
            </Button>
            <Button
              color="warning"
              onPress={() =>
                detalleEmpleado &&
                handleEstado(
                  detalleEmpleado,
                  detalleEmpleado.estado === "Suspendido"
                    ? "Activo"
                    : "Suspendido"
                )
              }
            >
              {detalleEmpleado?.estado === "Suspendido"
                ? "Reactivar"
                : "Suspender"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={!!rolAEliminar}
        onClose={() => setRolAEliminar(null)}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Eliminar rol</h3>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer
            </p>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-700">
              ¿Estás seguro de que deseas eliminar el rol{" "}
              <span className="font-semibold text-slate-900">
                &quot;{rolAEliminar?.nombre}&quot;
              </span>
              ? Esta acción eliminará permanentemente el rol y todos sus permisos asociados.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setRolAEliminar(null)}
              isDisabled={isDeletingRol}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleEliminarRol}
              isLoading={isDeletingRol}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de edición de empleado */}
      <Modal
        isOpen={!!empleadoAEditar}
        onClose={() => {
          setEmpleadoAEditar(null);
          setNuevaPassword("");
          setConfirmarPassword("");
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Editar empleado</h3>
            <p className="text-sm text-gray-500">
              {empleadoAEditar?.nombreCompleto}
            </p>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Ej: Sofia"
                value={empleadoEditDraft.nombre}
                onChange={(e) =>
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    nombre: e.target.value,
                  }))
                }
                isRequired
              />
              <Input
                label="Apellido"
                placeholder="Ej: Romero"
                value={empleadoEditDraft.apellido}
                onChange={(e) =>
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    apellido: e.target.value,
                  }))
                }
                isRequired
              />
              <Input
                label="DNI (opcional)"
                placeholder="12345678"
                value={empleadoEditDraft.dni}
                onChange={(e) =>
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    dni: e.target.value,
                  }))
                }
              />
              <Input
                label="Teléfono (opcional)"
                placeholder="+54 11 5555 0000"
                value={empleadoEditDraft.telefono}
                onChange={(e) =>
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    telefono: e.target.value,
                  }))
                }
              />
              <Input
                label="Dirección"
                placeholder="Calle y número"
                value={empleadoEditDraft.direccion}
                onChange={(e) =>
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    direccion: e.target.value,
                  }))
                }
                isRequired
                className="md:col-span-2"
              />
              <Select
                label="Provincia"
                selectedKeys={
                  empleadoEditDraft.provinciaId ? [empleadoEditDraft.provinciaId] : []
                }
                onChange={(e) => {
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    provinciaId: e.target.value,
                    departamentoId: "",
                    localidadId: "",
                  }));
                  setProvinciaSeleccionada(e.target.value);
                }}
                placeholder="Selecciona una provincia"
              >
                {provincias.map((prov) => (
                  <SelectItem key={String(prov.Id)}>
                    {prov.Descripcion}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Departamento"
                selectedKeys={
                  empleadoEditDraft.departamentoId ? [empleadoEditDraft.departamentoId] : []
                }
                onChange={(e) => {
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    departamentoId: e.target.value,
                    localidadId: "",
                  }));
                  setDepartamentoSeleccionado(e.target.value);
                }}
                placeholder="Selecciona un departamento"
                isDisabled={!empleadoEditDraft.provinciaId}
              >
                {departamentos.map((dep) => (
                  <SelectItem key={String(dep.Id)}>
                    {dep.Descripcion}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Localidad"
                selectedKeys={
                  empleadoEditDraft.localidadId ? [empleadoEditDraft.localidadId] : []
                }
                onChange={(e) =>
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    localidadId: e.target.value,
                  }))
                }
                placeholder="Selecciona una localidad"
                isDisabled={!empleadoEditDraft.departamentoId}
                isRequired
                className="md:col-span-2"
              >
                {localidades.map((loc) => (
                  <SelectItem key={String(loc.Id)}>
                    {loc.Descripcion}
                  </SelectItem>
                ))}
              </Select>
              <Select
                label="Rol"
                selectedKeys={empleadoEditDraft.rolId ? [empleadoEditDraft.rolId] : []}
                onChange={(e) =>
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    rolId: e.target.value,
                  }))
                }
                placeholder="Selecciona un rol"
                className="md:col-span-2"
              >
                {roles.map((rol) => (
                  <SelectItem key={String(rol.id)}>{rol.nombre}</SelectItem>
                ))}
              </Select>
            </div>

            <Divider className="my-4" />

            {/* Sección de cambio de contraseña */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Cambiar contraseña
              </h4>
              <Input
                label="Nueva contraseña"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
              />
              <Button
                color="warning"
                variant="flat"
                size="sm"
                onPress={handleCambiarPassword}
                isLoading={isChangingPassword}
                isDisabled={!nuevaPassword || nuevaPassword.length < 8 || nuevaPassword !== confirmarPassword}
              >
                Cambiar contraseña
              </Button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setEmpleadoAEditar(null);
                setNuevaPassword("");
                setConfirmarPassword("");
              }}
              isDisabled={isSavingEmpleado || isChangingPassword}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleEditarEmpleado}
              isLoading={isSavingEmpleado}
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
