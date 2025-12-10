"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  Tooltip,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

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

export default function Empleados() {
  const { user } = useSupabaseAuthContext();

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
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string>("");
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
        empleado.nombreCompleto.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
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
    const tenantMeta = (meta?.tenant_id as string | number | undefined) ?? meta?.tenantId;
    const fromUser = (user as any)?.tenantId as string | number | undefined;
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
      const rolesRes = await fetch(`/api/roles${tenantQuery}`, { cache: "no-store" }).catch(
        () => null
      );
      const provRes = await fetch("/api/provincias", { cache: "no-store" }).catch(() => null);
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
          description: rolesErr?.error ?? "Usando roles por defecto (Admin/Empleado).",
          color: "warning",
        });
        setRoles(fallbackRoles);
      } else {
        const rolesJson = await rolesRes.json();
        const parsedRoles = Array.isArray(rolesJson?.roles)
          ? rolesJson.roles.map((rol: any) => ({
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
        setEmpleados(Array.isArray(empJson?.empleados) ? empJson.empleados : []);
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
        description: (error as Error).message ?? "No pudimos cargar empleados y roles.",
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
        provinciaId: provinciaSeleccionada ? Number(provinciaSeleccionada) : null,
        dni: nuevoUsuario.dni || null,
        nombreUsuario: nuevoUsuario.usuario.trim(),
        password: nuevoUsuario.password,
        rolId: nuevoUsuario.rolId ? Number(nuevoUsuario.rolId) : undefined,
      };

      const res = await fetch(`/api/empleados${tenantQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo crear el usuario");
      }

      const data = await res.json();
      if (data?.empleado) {
        setEmpleados((prev) => [...prev, data.empleado]);
      }

      addToast({
        title: "Usuario creado",
        description: nuevoUsuario.autoInvitar
          ? "Se enviÃ³ la invitaciÃ³n. PodrÃ¡s ajustar permisos desde roles."
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
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
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

  const handleEstado = async (empleado: Empleado, siguiente: EstadoEmpleado) => {
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
          siguiente === "Suspendido" ? "Usuario suspendido." : "Usuario activo.",
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
    <div className="max-w-7xl mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-800 to-emerald-600 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),transparent_35%)]" />
        <div className="relative p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <Chip variant="flat" color="success" className="bg-white/10">
                Equipo y accesos
              </Chip>
              <h1 className="text-3xl font-bold">Empleados y roles</h1>
              <p className="text-white/80 max-w-2xl">
                Crea usuarios, asigna roles y controla quien puede operar tu negocio.
                Tenant: {user?.user_metadata?.tenant_id ?? "no definido"}.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Chip size="sm" className="bg-white/15 text-white" variant="flat">
                  Activos: {resumen.activos}
                </Chip>
                <Chip size="sm" className="bg-white/15 text-white" variant="flat">
                  Invitados: {resumen.invitados}
                </Chip>
                <Chip size="sm" className="bg-white/15 text-white" variant="flat">
                  Roles: {resumen.roles}
                </Chip>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                color="primary"
                className="bg-white text-slate-900"
                onPress={() => setOpenRolModal(true)}
              >
                + Nuevo rol
              </Button>
              <Button
                variant="bordered"
                className="border-white/40 text-white"
                onPress={() =>
                  addToast({
                    title: "Exportar",
                    description: "Exportaremos en la siguiente iteraciÃ³n.",
                  })
                }
              >
                Exportar equipo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-sm border border-slate-200">
          <CardHeader className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Alta rapida</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Crear usuario y asignar rol
              </h2>
            </div>
            <Chip color="success" variant="flat">
              Sin costo extra
            </Chip>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="Ej: Sofia"
                value={nuevoUsuario.nombre}
                onChange={(e) =>
                  setNuevoUsuario((prev) => ({ ...prev, nombre: e.target.value }))
                }
              />
              <Input
                label="Apellido"
                placeholder="Ej: Romero"
                value={nuevoUsuario.apellido}
                onChange={(e) =>
                  setNuevoUsuario((prev) => ({ ...prev, apellido: e.target.value }))
                }
              />
              <Input
                label="Correo"
                type="email"
                placeholder="correo@puntox.com"
                value={nuevoUsuario.email}
                onChange={(e) =>
                  setNuevoUsuario((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <Input
                label="Usuario"
                placeholder="usuario de acceso"
                value={nuevoUsuario.usuario}
                onChange={(e) =>
                  setNuevoUsuario((prev) => ({ ...prev, usuario: e.target.value }))
                }
              />
              <Input
                label="ContraseÃ±a"
                type="password"
                placeholder="Minimo 8 caracteres"
                value={nuevoUsuario.password}
                onChange={(e) =>
                  setNuevoUsuario((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <Input
                label="Telefono"
                placeholder="+54 11 5555 0000"
                value={nuevoUsuario.telefono}
                onChange={(e) =>
                  setNuevoUsuario((prev) => ({ ...prev, telefono: e.target.value }))
                }
              />
              <Input
                label="Direccion"
                placeholder="Calle y nÃºmero"
                value={nuevoUsuario.direccion}
                onChange={(e) =>
                  setNuevoUsuario((prev) => ({ ...prev, direccion: e.target.value }))
                }
              />
              <Select
                label="Provincia"
                selectedKeys={provinciaSeleccionada ? [provinciaSeleccionada] : []}
                onChange={(e) => setProvinciaSeleccionada(e.target.value)}
                placeholder="Selecciona una provincia"
              >
                {provincias.map((prov) => (
                  <SelectItem key={String(prov.Id)}>{prov.Descripcion}</SelectItem>
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
                  <SelectItem key={String(dep.Id)}>{dep.Descripcion}</SelectItem>
                ))}
              </Select>
              {/* Buscador de localidad removido para evitar estados no usados */}
            <Select
              label="Localidad"
              selectedKeys={nuevoUsuario.localidadId ? [nuevoUsuario.localidadId] : []}
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
                  <SelectItem key={String(loc.Id)}>{loc.Descripcion}</SelectItem>
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
                  setNuevoUsuario((prev) => ({ ...prev, rolId: e.target.value }))
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
            <div className="flex justify-end">
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

        <div className="space-y-4">
          <Card className="shadow-sm border border-slate-200">
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Salud del equipo</p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Checklist de seguridad
                  </h3>
                </div>
                <Chip variant="flat" color="success">
                  3/4 ok
                </Chip>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Forzar 2FA</span>
                  <Switch size="sm" defaultSelected />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Expirar sesiones a 30 dias</span>
                  <Switch size="sm" defaultSelected />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Bloquear tras 5 intentos</span>
                  <Switch size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Alertas de ingreso nuevo device</span>
                  <Switch size="sm" defaultSelected />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="shadow-sm border border-slate-200">
            <CardBody className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Atajos</p>
                  <h3 className="text-lg font-semibold text-slate-900">Acciones rapidas</h3>
                </div>
                <Chip size="sm" variant="flat">
                  Beta
                </Chip>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="light" onPress={() => setOpenRolModal(true)}>
                  Crear rol con limites de caja
                </Button>
                <Button
                  variant="light"
                  onPress={() =>
                    addToast({
                      title: "Invitaciones reenviadas",
                      description: "Recordatorio enviado a pendientes.",
                      color: "success",
                    })
                  }
                >
                  Reenviar invitaciones
                </Button>
                <Button
                  variant="light"
                  onPress={() =>
                    addToast({
                      title: "Checklist descargado",
                      description: "Se guardÃ³ como CSV.",
                      color: "success",
                    })
                  }
                >
                  Exportar checklist de accesos
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-sm border border-slate-200">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Equipo</p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Empleados y accesos
                </h2>
              </div>
              <div className="flex gap-2">
                <Input
                  size="sm"
                  placeholder="Buscar por nombre o correo"
                  value={filtros.busqueda}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))
                  }
                  className="max-w-xs"
                />
                <Select
                  size="sm"
                  selectedKeys={[filtros.rol]}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, rol: e.target.value }))
                  }
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
          <CardBody className="overflow-x-auto">
            <Table
              aria-label="Empleados"
              removeWrapper
              isHeaderSticky={false}
              bottomContentPlacement="outside"
              bottomContent={
                <p className="text-xs text-gray-500 px-2">
                  Usa los filtros para segmentar por rol o estado.
                </p>
              }
            >
              <TableHeader>
                <TableColumn>NOMBRE</TableColumn>
                <TableColumn>ROL</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>ESTADO</TableColumn>
                <TableColumn>ULTIMA ACTIVIDAD</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={isLoadingData ? "Cargando..." : "Sin coincidencias"}
              >
                {empleadosFiltrados.map((empleado) => (
                  <TableRow key={empleado.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {empleado.nombreCompleto}
                        </span>
                        <span className="text-xs text-gray-500">
                          Legajo {empleado.legajo ?? "â€”"} â€¢{" "}
                          {empleado.localidad ?? "Localidad pendiente"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {empleado.rolNombre ?? getRolNombre(empleado.rolId) ?? "Sin rol"}{" "}
                        Â·{" "}
                        {empleado.rolTipo ??
                          getRolTipo(empleado.rolId) ??
                          "Empleado"}
                      </Chip>
                    </TableCell>
                    <TableCell>{empleado.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={estadoColor(empleado.estado)}
                        variant="flat"
                      >
                        {empleado.estado}
                      </Chip>
                    </TableCell>
                    <TableCell>{empleado.ultimaActividad ?? "Pendiente"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Tooltip content="Ver ficha">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => setDetalleEmpleado(empleado)}
                          >
                            ðŸ‘
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
                            âš¡
                          </Button>
                        </Tooltip>
                        <Tooltip content="Reenviar invitacion">
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
                            âœ‰
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Roles</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Libreria de roles
                </h3>
              </div>
              <Button size="sm" variant="flat" onPress={() => setOpenRolModal(true)}>
                + Crear rol
              </Button>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-3">
              {roles.map((rol) => (
                <div
                  key={rol.id}
                  className="p-3 rounded-xl border border-slate-200 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{rol.nombre}</h4>
                        <Chip size="sm" variant="flat">
                          {rol.tipo === "ADMINISTRADOR" ? "Administrador" : "Empleado"}
                        </Chip>
                        <Chip
                          size="sm"
                          color={criticidadColor(rol.usuarios)}
                          variant="flat"
                        >
                          Uso {rol.usuarios}
                        </Chip>
                      </div>
                      <p className="text-sm text-gray-600">
                        Rol disponible para asignar a los usuarios del tenant.
                      </p>
                </div>
                <Chip size="sm" variant="flat">
                  {rol.usuarios} usuarios
                </Chip>
              </div>
              <div className="flex flex-wrap gap-2">
                {(rol.permisos?.length ? rol.permisos : permisosDisponibles.slice(0, 2)).map(
                  (permiso) => (
                    <Chip key={`${rol.id}-${permiso}`} size="sm" variant="bordered">
                      {permiso}
                    </Chip>
                  )
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

          <Card className="shadow-sm border border-slate-200">
            <CardHeader className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ultimos movimientos</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  Auditoria rapida
                </h3>
              </div>
              <Chip size="sm" variant="flat" color="warning">
                Live
              </Chip>
            </CardHeader>
            <Divider />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Lucas activo 2FA para cajas
                  </p>
                  <p className="text-sm text-gray-500">Hace 15 min</p>
                </div>
                <Chip size="sm" color="success" variant="flat">
                  Seguridad
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    Se creo rol "Supervisor de turno"
                  </p>
                  <p className="text-sm text-gray-500">Hace 1h</p>
                </div>
                <Chip size="sm" color="primary" variant="flat">
                  Roles
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    2 invitaciones pendientes de aceptacion
                  </p>
                  <p className="text-sm text-gray-500">Hoy</p>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() =>
                    addToast({
                      title: "Recordatorio enviado",
                      description: "Notificamos a pendientes.",
                      color: "success",
                    })
                  }
                >
                  Reenviar
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={openRolModal} onClose={() => setOpenRolModal(false)} size="lg">
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
                setNuevoRol((prev) => ({ ...prev, descripcion: e.target.value }))
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
            <Button color="primary" onPress={handleCrearRol} isLoading={isSavingRole}>
              Crear rol
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!detalleEmpleado} onClose={() => setDetalleEmpleado(null)}>
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
                Â·{" "}
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
                  detalleEmpleado ? estadoColor(detalleEmpleado.estado) : "default"
                }
                variant="flat"
              >
                {detalleEmpleado?.estado}
              </Chip>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Legajo</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.legajo ?? "â€”"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Localidad</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.localidad ?? "â€”"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Telefono</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.telefono ?? "â€”"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Direccion</span>
              <span className="font-medium text-slate-900">
                {detalleEmpleado?.direccion ?? "â€”"}
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
                  detalleEmpleado.estado === "Suspendido" ? "Activo" : "Suspendido"
                )
              }
            >
              {detalleEmpleado?.estado === "Suspendido" ? "Reactivar" : "Suspender"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}


