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
import { usePagePermission } from "@/lib/permissions/usePagePermission";
import { Pencil, Trash2, Eye, Zap, Mail } from "lucide-react";
import Pagination, { PaginationInfo } from "@/components/common/Pagination";
import {
  formatTiempoRelativo,
  formatearAccion,
  mapearAccion,
  mapearSeveridad,
} from "./auditoria-utils";
import { useEmpleados } from "@/hooks/useEmpleados";

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

function rolChipColor(tipo: "ADMINISTRADOR" | "EMPLEADO" | "Empleado" | "Administrador" | null | undefined): "primary" | "secondary" | "default" {
  if (tipo === "ADMINISTRADOR" || tipo === "Administrador") return "primary";
  if (tipo === "EMPLEADO" || tipo === "Empleado") return "secondary";
  return "default";
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
  const { user, status } = useSupabaseAuthContext();
  const router = useRouter();
  const { tieneAcceso, isLoading: isLoadingPermisos } = usePagePermission();

  const [isAuthorized, setIsAuthorized] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>("usuarios");
  
  // Estado de paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [auditoriaPage, setAuditoriaPage] = useState(1);
  const [auditoriaLimit] = useState(10);
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
  const [rolAEditar, setRolAEditar] = useState<Rol | null>(null);
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

  // Los datos ahora vienen del hook, pero necesitamos inicializarlos después de la declaración del hook

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

  // Usar TanStack Query hook
  const tenantId = isSuperAdmin ? resolveTenantIdForRequests() : null;
  
  // Memorizar filters para evitar recrear el objeto en cada render
  const filtersMemo = useMemo(
    () => ({
      busqueda: filtros.busqueda,
      rol: filtros.rol,
      estado: filtros.estado,
    }),
    [filtros.busqueda, filtros.rol, filtros.estado]
  );

  // Memorizar enabled para evitar cambios innecesarios
  const enabledQuery = useMemo(
    () => !!user && status === "authenticated" && isAuthorized,
    [user, status, isAuthorized]
  );

  const {
    empleados,
    roles,
    provincias,
    auditorias,
    auditoriasPagination,
    pagination,
    isLoadingEmpleados,
    isLoadingRoles,
    isLoadingProvincias,
    isLoadingAuditorias,
    errorEmpleados,
    errorRoles,
    errorProvincias,
    refetchEmpleados,
    refetchRoles,
    refetchProvincias,
    refetchAuditorias,
    createEmpleado: createEmpleadoMutation,
    updateEmpleado: updateEmpleadoMutation,
    deleteEmpleado: deleteEmpleadoMutation,
    changePassword: changePasswordMutation,
    createRol: createRolMutation,
    updateRol: updateRolMutation,
    deleteRol: deleteRolMutation,
    isCreatingEmpleado,
    isUpdatingEmpleado,
    isDeletingEmpleado,
    isChangingPassword,
    isCreatingRol,
    isUpdatingRol,
    isDeletingRol,
    useDepartamentos,
    useLocalidades,
  } = useEmpleados({
    page,
    limit,
    filters: filtersMemo,
    tenantId,
    enabled: enabledQuery,
    auditoriaPage,
    auditoriaLimit,
  });

  // Hooks para departamentos y localidades
  const departamentosQuery = useDepartamentos(provinciaSeleccionada || null);
  const localidadesQuery = useLocalidades(departamentoSeleccionado || null);
  const departamentos = departamentosQuery.data || [];
  const localidades = localidadesQuery.data || [];

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

  // Debug: Mostrar errores si los hay
  useEffect(() => {
    if (errorEmpleados) {
      console.error("Error al cargar empleados:", errorEmpleados);
      addToast({
        title: "Error al cargar empleados",
        description: errorEmpleados instanceof Error ? errorEmpleados.message : "Error desconocido",
        color: "danger",
      });
    }
    if (errorRoles) {
      console.error("Error al cargar roles:", errorRoles);
      addToast({
        title: "Error al cargar roles",
        description: errorRoles instanceof Error ? errorRoles.message : "Error desconocido",
        color: "danger",
      });
    }
    if (errorProvincias) {
      console.error("Error al cargar provincias:", errorProvincias);
      addToast({
        title: "Error al cargar provincias",
        description: errorProvincias instanceof Error ? errorProvincias.message : "Error desconocido",
        color: "danger",
      });
    }
  }, [errorEmpleados, errorRoles, errorProvincias]);

  // Debug: Verificar si las queries están habilitadas (solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Debug empleados:", {
        enabled: enabledQuery,
        user: !!user,
        status,
        isAuthorized,
        isLoadingEmpleados,
        isLoadingRoles,
        empleadosCount: empleados.length,
        rolesCount: roles.length,
        errorEmpleados: errorEmpleados?.message,
        errorRoles: errorRoles?.message,
      });
    }
  }, [enabledQuery, user, status, isAuthorized, isLoadingEmpleados, isLoadingRoles, empleados.length, roles.length, errorEmpleados, errorRoles]);

  // Sincronizar departamentoSeleccionado con empleadoEditDraft cuando se abre el modal
  // IMPORTANTE: Solo sincronizar cuando realmente hay un empleado siendo editado
  useEffect(() => {
    if (empleadoAEditar && empleadoEditDraft.departamentoId) {
      // Si hay un departamento en el draft pero no está sincronizado con departamentoSeleccionado
      if (departamentoSeleccionado !== empleadoEditDraft.departamentoId) {
        setDepartamentoSeleccionado(empleadoEditDraft.departamentoId);
      }
    }
  }, [empleadoAEditar, empleadoEditDraft.departamentoId, departamentoSeleccionado]);

  // Limpiar estados de ubicación cuando se cierra el modal de edición
  // Esto previene que queden valores residuales en el formulario de creación
  const prevEmpleadoAEditarRef = useRef<Empleado | null>(null);
  useEffect(() => {
    // Si había un empleado siendo editado y ahora no hay ninguno, limpiar los estados
    if (prevEmpleadoAEditarRef.current && !empleadoAEditar) {
      setDepartamentoSeleccionado("");
      setProvinciaSeleccionada("");
    }
    // Actualizar la referencia
    prevEmpleadoAEditarRef.current = empleadoAEditar;
  }, [empleadoAEditar]);

  // Verificar permisos al montar el componente
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user || status !== "authenticated") {
        return;
      }

      try {
        const permisosRes = await fetch("/api/permisos", {
          cache: "no-store",
          credentials: "include",
        }).catch(() => null);
        
        if (!permisosRes || !permisosRes.ok) {
          const status = permisosRes?.status;
          if (status === 401 || status === 403) {
            setIsAuthorized(false);
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
    };

    checkPermissions();
  }, [user, status, isSuperAdminLocal]);

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

  // Redirigir al login si el usuario cierra sesión (sin hacer peticiones)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
  }, [status, router]);

  // NOTA: No necesitamos useEffect para refetch - TanStack Query maneja automáticamente
  // los refetches cuando cambian los parámetros (page, limit, filters) o cuando
  // las queries se invalidan después de mutaciones

  // Los departamentos y localidades se cargan automáticamente con TanStack Query
  useEffect(() => {
    if (provinciaSeleccionada) {
      setDepartamentoSeleccionado("");
      setNuevoUsuario((prev) => ({ ...prev, localidadId: "" }));
    }
  }, [provinciaSeleccionada]);

  useEffect(() => {
    if (departamentoSeleccionado) {
      setNuevoUsuario((prev) => ({ ...prev, localidadId: "" }));
    }
  }, [departamentoSeleccionado]);

  // Cargar auditorías cuando se selecciona el tab de auditoría
  useEffect(() => {
    if (selectedTab === "auditoria" && enabledQuery) {
      refetchAuditorias();
    }
  }, [selectedTab, enabledQuery, refetchAuditorias]);

  // Sincronizar paginación de auditorías con la query
  useEffect(() => {
    if (auditoriasPagination) {
      setPaginationAuditoria(auditoriasPagination);
    }
  }, [auditoriasPagination]);

  // Cargar auditorías cuando cambia la paginación
  useEffect(() => {
    if (selectedTab === "auditoria" && enabledQuery) {
      refetchAuditorias();
    }
  }, [auditoriaPage, selectedTab, enabledQuery, refetchAuditorias]);

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

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoUsuario.email.trim())) {
      addToast({
        title: "Email inválido",
        description: "Por favor, ingresa un email válido.",
        color: "warning",
      });
      return;
    }

    // Validar longitud mínima de password
    if (nuevoUsuario.password.length < 8) {
      addToast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 8 caracteres.",
        color: "warning",
      });
      return;
    }

    const tenantParam = isSuperAdmin ? resolveTenantIdForRequests() : null;

    createEmpleadoMutation(
      {
        nombre: nuevoUsuario.nombre.trim(),
        apellido: nuevoUsuario.apellido.trim(),
        email: nuevoUsuario.email.trim(),
        telefono: nuevoUsuario.telefono || undefined,
        direccion: nuevoUsuario.direccion.trim(),
        localidadId: nuevoUsuario.localidadId,
        departamentoId: departamentoSeleccionado
          ? Number(departamentoSeleccionado)
          : null,
        provinciaId: provinciaSeleccionada
          ? Number(provinciaSeleccionada)
          : null,
        dni: nuevoUsuario.dni || undefined,
        usuario: nuevoUsuario.usuario.trim(),
        password: nuevoUsuario.password,
        rolId: nuevoUsuario.rolId ? Number(nuevoUsuario.rolId) : undefined,
        autoInvitar: nuevoUsuario.autoInvitar,
        tenantId: tenantParam,
      },
      {
        onSuccess: () => {
          addToast({
            title: "Usuario creado",
            description: nuevoUsuario.autoInvitar
              ? "Se envió la invitación. Podrás ajustar permisos desde roles."
              : "Usuario listo. Recuerda compartir las credenciales.",
            color: "success",
          });

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
        },
        onError: (error: Error) => {
          const errorMessage = error.message;
          
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
            return;
          }
        },
      }
    );
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

    // Usar la mutación del hook - ya maneja loading, errores, invalidación y toasts
    createRolMutation(
      {
        rolData: {
          nombre: nuevoRol.nombre,
          descripcion: nuevoRol.descripcion,
          tipo: nuevoRol.tipo,
          permisos: nuevoRol.permisos,
        },
        tenantId: isSuperAdmin ? resolveTenantIdForRequests() : null,
      },
      {
        onSuccess: () => {
          setOpenRolModal(false);
          setNuevoRol({
            nombre: "",
            descripcion: "",
            permisos: ["Ventas", "Caja"],
            tipo: "EMPLEADO",
          });
        },
      }
    );
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

    // Usar la mutación del hook - ya maneja loading, errores, invalidación y toasts
    updateRolMutation(
      {
        id: rolAEditar.id,
        rolData: {
          nombre: rolEditDraft.nombre,
          descripcion: rolEditDraft.descripcion,
          tipo: rolEditDraft.tipo,
          permisos: rolEditDraft.permisos,
        },
        tenantId: isSuperAdmin ? resolveTenantIdForRequests() : null,
      },
      {
        onSuccess: () => {
          setRolAEditar(null);
          setRolEditDraft({
            nombre: "",
            descripcion: "",
            tipo: "EMPLEADO",
            permisos: [],
          });
        },
      }
    );
  };

  const handleEliminarRol = async () => {
    if (!rolAEliminar) return;

    // Usar la mutación del hook - ya maneja loading, errores, invalidación y toasts
    deleteRolMutation(
      {
        id: rolAEliminar.id,
        tenantId: isSuperAdmin ? resolveTenantIdForRequests() : null,
      },
      {
        onSuccess: () => {
          setRolAEliminar(null);
        },
      }
    );
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

      // TanStack Query ya invalida las queries automáticamente, no necesitamos refetch manual
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

    // Usar la mutación del hook - ya maneja loading, errores, invalidación y toasts
    deleteEmpleadoMutation(
      {
        id: empleado.personaId,
        tenantId: isSuperAdmin ? resolveTenantIdForRequests() : null,
      },
      {
        onSuccess: () => {
          addToast({
            title: "Empleado eliminado",
            description: `${empleado.nombreCompleto} fue eliminado.`,
            color: "success",
          });
        },
      }
    );
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

    // Construir el objeto de datos a actualizar (solo campos que cambiaron)
    const updateData: any = {
      personaId: empleadoAEditar.personaId,
    };

    if (empleadoEditDraft.nombre !== empleadoAEditar.nombre) {
      updateData.nombre = empleadoEditDraft.nombre.trim();
    }
    if (empleadoEditDraft.apellido !== empleadoAEditar.apellido) {
      updateData.apellido = empleadoEditDraft.apellido.trim();
    }
    if (empleadoEditDraft.dni !== (empleadoAEditar.dni || "")) {
      updateData.dni = empleadoEditDraft.dni || null;
    }
    if (empleadoEditDraft.direccion !== (empleadoAEditar.direccion || "")) {
      updateData.direccion = empleadoEditDraft.direccion.trim();
    }
    if (empleadoEditDraft.telefono !== (empleadoAEditar.telefono || "")) {
      updateData.telefono = empleadoEditDraft.telefono || null;
    }
    if (Number(empleadoEditDraft.localidadId) !== (empleadoAEditar.localidadId || null)) {
      updateData.localidadId = Number(empleadoEditDraft.localidadId);
    }
    if (empleadoEditDraft.provinciaId) {
      updateData.provinciaId = Number(empleadoEditDraft.provinciaId);
    }
    if (empleadoEditDraft.departamentoId) {
      updateData.departamentoId = Number(empleadoEditDraft.departamentoId);
    }
    if (empleadoEditDraft.rolId !== (empleadoAEditar.rolId ? String(empleadoAEditar.rolId) : "")) {
      updateData.rolId = empleadoEditDraft.rolId ? Number(empleadoEditDraft.rolId) : null;
    }

    // Usar la mutación del hook en lugar de fetch manual
    // La mutación ya maneja el loading, errores, invalidación de queries y toasts
    updateEmpleadoMutation(
      {
        id: empleadoAEditar.personaId,
        data: updateData,
        tenantId: isSuperAdmin ? resolveTenantIdForRequests() : null,
      },
      {
        onSuccess: () => {
          // Limpiar el modal después de actualizar exitosamente
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
          // Limpiar estados de ubicación
          setProvinciaSeleccionada("");
          setDepartamentoSeleccionado("");
        },
      }
    );
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

    // Usar la mutación del hook - ya maneja loading, errores, invalidación y toasts
    changePasswordMutation(
      {
        usuarioId: empleadoAEditar.usuarioId!,
        nuevaPassword,
        tenantId: isSuperAdmin ? resolveTenantIdForRequests() : null,
      },
      {
        onSuccess: () => {
          // Limpiar campos después de cambiar la contraseña exitosamente
          setNuevaPassword("");
          setConfirmarPassword("");
        },
      }
    );
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
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
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
                    isLoading={isCreatingEmpleado}
                    isDisabled={isLoadingEmpleados}
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
                                // Establecer departamento - el useEffect se encargará de sincronizar
                                if (departamentoIdStr) {
                                  setDepartamentoSeleccionado(departamentoIdStr);
                                  // Las localidades se cargan automáticamente cuando se selecciona un departamento
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
                    {isLoadingEmpleados ? "Cargando..." : "Sin coincidencias"}
                  </p>
                )}
              </CardBody>
              
              {/* Paginación */}
              {pagination && pagination.total > 0 && (
                <div className="px-4 pb-4">
                  <Pagination
                    pagination={pagination || {
                      page: 1,
                      limit: 20,
                      total: 0,
                      totalPages: 1,
                      hasNextPage: false,
                      hasPreviousPage: false,
                    }}
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
              {isLoadingAuditorias ? (
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
                    isDisabled={!paginationAuditoria.hasPreviousPage || isLoadingAuditorias}
                    onPress={() => {
                      setAuditoriaPage((prev) => Math.max(1, prev - 1));
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
                    isDisabled={!paginationAuditoria.hasNextPage || isLoadingAuditorias}
                    onPress={() => {
                      setAuditoriaPage((prev) => prev + 1);
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
              isLoading={isCreatingRol}
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
              isDisabled={isUpdatingRol}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleEditarRol}
              isLoading={isUpdatingRol}
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
          // Limpiar estados de ubicación para que no queden en el formulario de creación
          setProvinciaSeleccionada("");
          setDepartamentoSeleccionado("");
          // Limpiar el draft de edición
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
                placeholder={isLoadingProvincias ? "Cargando provincias..." : "Selecciona una provincia"}
                isLoading={isLoadingProvincias}
                isDisabled={isLoadingProvincias}
              >
                {provincias.length === 0 && !isLoadingProvincias ? (
                  <SelectItem key="no-items" isDisabled>
                    No hay provincias disponibles
                  </SelectItem>
                ) : (
                  provincias.map((prov) => (
                    <SelectItem key={String(prov.Id)}>
                      {prov.Descripcion}
                    </SelectItem>
                  ))
                )}
              </Select>
              <Select
                label="Departamento"
                selectedKeys={
                  empleadoEditDraft.departamentoId ? [empleadoEditDraft.departamentoId] : []
                }
                onChange={(e) => {
                  const deptId = e.target.value;
                  setEmpleadoEditDraft((prev) => ({
                    ...prev,
                    departamentoId: deptId,
                    localidadId: "", // Limpiar localidad al cambiar departamento
                  }));
                  // Sincronizar con el estado que usa el hook
                  setDepartamentoSeleccionado(deptId);
                }}
                placeholder={
                  !empleadoEditDraft.provinciaId
                    ? "Selecciona una provincia primero"
                    : departamentosQuery.isLoading
                    ? "Cargando departamentos..."
                    : "Selecciona un departamento"
                }
                isLoading={departamentosQuery.isLoading}
                isDisabled={!empleadoEditDraft.provinciaId || departamentosQuery.isLoading}
              >
                {departamentos.length === 0 && !departamentosQuery.isLoading && empleadoEditDraft.provinciaId ? (
                  <SelectItem key="no-items" isDisabled>
                    No hay departamentos disponibles
                  </SelectItem>
                ) : (
                  departamentos.map((dep) => (
                    <SelectItem key={String(dep.Id)}>
                      {dep.Descripcion}
                    </SelectItem>
                  ))
                )}
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
                placeholder={
                  !empleadoEditDraft.departamentoId
                    ? "Selecciona un departamento primero"
                    : localidadesQuery.isLoading
                    ? "Cargando localidades..."
                    : "Selecciona una localidad"
                }
                isLoading={localidadesQuery.isLoading}
                isDisabled={!empleadoEditDraft.departamentoId || localidadesQuery.isLoading}
                isRequired
                className="md:col-span-2"
              >
                {localidades.length === 0 && !localidadesQuery.isLoading && empleadoEditDraft.departamentoId ? (
                  <SelectItem key="no-items" isDisabled>
                    No hay localidades disponibles
                  </SelectItem>
                ) : (
                  localidades.map((loc) => (
                    <SelectItem key={String(loc.Id)}>
                      {loc.Descripcion}
                    </SelectItem>
                  ))
                )}
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
              isDisabled={isUpdatingEmpleado || isChangingPassword}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleEditarEmpleado}
              isLoading={isUpdatingEmpleado}
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
