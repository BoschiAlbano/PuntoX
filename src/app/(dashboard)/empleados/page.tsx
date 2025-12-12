"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Pencil, Trash2 } from "lucide-react";

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

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  const [filtros, setFiltros] = useState({
    busqueda: "",
    rol: "todos",
    estado: "todos",
  });

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

  const isSuperAdmin =
    user?.role === "superadmin" ||
    user?.role === "SuperAdmin" ||
    (user?.user_metadata as Record<string, unknown> | undefined)?.role ===
      "SuperAdmin";

  const resumen = useMemo(
    () => ({
      activos: empleados.filter((e) => e.estado === "Activo").length,
      invitados: empleados.filter((e) => e.estado === "Invitado").length,
      suspendidos: empleados.filter((e) => e.estado === "Suspendido").length,
      roles: roles.length,
    }),
    [empleados, roles]
  );

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((empleado) => {
      const matchBusqueda =
        filtros.busqueda.trim().length === 0 ||
        empleado.nombreCompleto
          .toLowerCase()
          .includes(filtros.busqueda.toLowerCase()) ||
        empleado.email.toLowerCase().includes(filtros.busqueda.toLowerCase());

      const matchRol =
        filtros.rol === "todos" || empleado.rolId === Number(filtros.rol);

      const matchEstado =
        filtros.estado === "todos" || empleado.estado === filtros.estado;

      return matchBusqueda && matchRol && matchEstado;
    });
  }, [empleados, filtros]);

  const resolveTenantIdForRequests = () => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
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
        const tienePermiso = Array.isArray(permisosJson?.permisos)
          ? permisosJson.permisos.includes("empleados:admin")
          : true;
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
      const tenantQuery = tenantParam ? `?tenantId=${tenantParam}` : "";
      const rolesRes = await fetch(`/api/roles${tenantQuery}`, {
        cache: "no-store",
      }).catch(() => null);
      const provRes = await fetch("/api/provincias", {
        cache: "no-store",
      }).catch(() => null);
      const empRes = await fetch(`/api/empleados${tenantQuery}`, {
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
        setEmpleados(
          Array.isArray(empJson?.empleados) ? empJson.empleados : []
        );
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

      setLocalidades([]);
      setDepartamentos([]);
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

  useEffect(() => {
    loadData();
  }, []);

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
      if (data?.empleado) {
        setEmpleados((prev) => [...prev, data.empleado]);
      }

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
      if (data?.rol) {
        const rolCreado: Rol = {
          id: Number(data.rol.id),
          nombre: data.rol.nombre,
          tipo: data.rol.tipo ?? "EMPLEADO",
          usuarios: Number(data.rol.usuarios ?? 0),
          descripcion: data.rol.descripcion ?? null,
          permisos: Array.isArray(data.rol.permisos) ? data.rol.permisos : [],
        };
        setRoles((prev) => [...prev, rolCreado]);
      }

      addToast({
        title: "Rol creado",
        description: "Asignalo desde la tabla o en el alta rapida.",
        color: "success",
      });
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

      setEmpleados((prev) =>
        prev.map((item) =>
          item.usuarioId === empleado.usuarioId
            ? { ...item, estado: data.estado ?? siguiente }
            : item
        )
      );
      addToast({
        title: "Actualizado",
        description:
          siguiente === "Suspendido"
            ? "Usuario suspendido."
            : "Usuario activo.",
        color: "success",
      });
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

      setEmpleados((prev) =>
        prev.filter((e) => e.personaId !== empleado.personaId)
      );
      addToast({
        title: "Empleado eliminado",
        description: `${empleado.nombreCompleto} fue eliminado.`,
        color: "success",
      });
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
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-800 to-emerald-600 text-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),transparent_35%)]" />
        <div className="relative p-6 sm:p-8 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-3">
              <Chip variant="flat" color="success" className="bg-white/10">
                Equipo y accesos
              </Chip>
              <h1 className="text-3xl sm:text-4xl font-bold">Empleados y roles</h1>
              <p className="text-white/80 max-w-2xl text-sm sm:text-base">
                Crea usuarios, asigna roles y controla quien puede operar tu
                negocio.
              </p>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <Chip
                  size="sm"
                  className="bg-white/15 text-white"
                  variant="flat"
                >
                  Activos: {resumen.activos}
                </Chip>
                <Chip
                  size="sm"
                  className="bg-white/15 text-white"
                  variant="flat"
                >
                  Invitados: {resumen.invitados}
                </Chip>
                <Chip
                  size="sm"
                  className="bg-white/15 text-white"
                  variant="flat"
                >
                  Roles: {resumen.roles}
                </Chip>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <Button
                color="primary"
                className="bg-white text-slate-900"
                onPress={() => setOpenRolModal(true)}
                size="sm"
              >
                + Nuevo rol
              </Button>
              <Button
                variant="bordered"
                className="border-white/40 text-white"
                onPress={() =>
                  addToast({
                    title: "Exportar",
                    description: "Exportaremos en la siguiente iteración.",
                  })
                }
                size="sm"
              >
                Exportar equipo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Tabs
        aria-label="Gestión de empleados y roles"
        color="primary"
        variant="underlined"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
      >
        <Tab
          key="usuarios"
          title={
            <div className="flex items-center space-x-2">
              <span>👥</span>
              <span>Usuarios</span>
            </div>
          }
        >
          <div className="mt-6 space-y-6">
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
                      value={filtros.busqueda}
                      onChange={(e) =>
                        setFiltros((prev) => ({
                          ...prev,
                          busqueda: e.target.value,
                        }))
                      }
                      className="w-full md:max-w-xs"
                    />

                    <Select
                      size="sm"
                      selectedKeys={[filtros.rol]}
                      onChange={(e) =>
                        setFiltros((prev) => ({ ...prev, rol: e.target.value }))
                      }
                      className="w-full md:min-w-[160px]"
                    >
                      <SelectItem key="todos">Todos los roles</SelectItem>
                      {roles.map((rol) => (
                        <SelectItem key={String(rol.id)}>{rol.nombre}</SelectItem>
                      ))}
                    </Select>
                    <Select
                      size="sm"
                      selectedKeys={[filtros.estado]}
                      onChange={(e) =>
                        setFiltros((prev) => ({ ...prev, estado: e.target.value }))
                      }
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
                {empleadosFiltrados.map((empleado) => {
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
                          <span>{empleado.ultimaActividad ?? "Pendiente"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tooltip content="Ver ficha">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => setDetalleEmpleado(empleado)}
                          >
                            🔍
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
                            ⚡
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
                            ✉️
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
                            🗑
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
                {empleadosFiltrados.length === 0 && (
                  <p className="text-sm text-gray-500 px-2 py-4 text-center">
                    {isLoadingData ? "Cargando..." : "Sin coincidencias"}
                  </p>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab
          key="roles"
          title={
            <div className="flex items-center space-x-2">
              <span>🎭</span>
              <span>Roles</span>
            </div>
          }
        >
          <Card className="mt-6 shadow-sm border border-slate-200">
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
        </Tab>

        <Tab
          key="auditoria"
          title={
            <div className="flex items-center space-x-2">
              <span>📊</span>
              <span>Auditoría de accesos</span>
            </div>
          }
        >
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
              {/* Mock data - máximo 10 items para preview */}
              {[
                {
                  id: 1,
                  accion: "Lucas activo 2FA para cajas",
                  tiempo: "Hace 15 min",
                  categoria: "Seguridad",
                  color: "success",
                },
                {
                  id: 2,
                  accion: "Se creó rol Supervisor de turno",
                  tiempo: "Hace 1h",
                  categoria: "Roles",
                  color: "primary",
                },
                {
                  id: 3,
                  accion: "2 invitaciones pendientes de aceptación",
                  tiempo: "Hoy",
                  categoria: "Invitaciones",
                  color: "warning",
                },
                {
                  id: 4,
                  accion: "Usuario suspendido: Juan Pérez",
                  tiempo: "Hace 2h",
                  categoria: "Usuarios",
                  color: "danger",
                },
                {
                  id: 5,
                  accion: "Cambio de permisos en rol Empleado",
                  tiempo: "Hace 3h",
                  categoria: "Roles",
                  color: "primary",
                },
                {
                  id: 6,
                  accion: "Nuevo usuario creado: María García",
                  tiempo: "Ayer",
                  categoria: "Usuarios",
                  color: "success",
                },
                {
                  id: 7,
                  accion: "Sesión expirada por inactividad",
                  tiempo: "Ayer",
                  categoria: "Seguridad",
                  color: "warning",
                },
                {
                  id: 8,
                  accion: "Rol eliminado: Vendedor temporal",
                  tiempo: "Hace 2 días",
                  categoria: "Roles",
                  color: "danger",
                },
                {
                  id: 9,
                  accion: "Actualización de configuración de seguridad",
                  tiempo: "Hace 2 días",
                  categoria: "Seguridad",
                  color: "primary",
                },
                {
                  id: 10,
                  accion: "Exportación de lista de empleados",
                  tiempo: "Hace 3 días",
                  categoria: "Usuarios",
                  color: "default",
                },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-semibold text-slate-900">{item.accion}</p>
                    <p className="text-sm text-gray-500">{item.tiempo}</p>
                  </div>
                  <Chip size="sm" color={item.color as any} variant="flat">
                    {item.categoria}
                  </Chip>
                </div>
              ))}
              <Divider className="my-4" />
              <div className="flex justify-center pt-2">
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => router.push("/analiticas?tab=logs")}
                >
                  Ver logs completos
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

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
                {detalleEmpleado?.ultimaActividad ?? "Pendiente"}
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
                "{rolAEliminar?.nombre}"
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
    </div>
  );
}
