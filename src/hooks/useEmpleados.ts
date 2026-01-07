import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addToast } from "@heroui/react";
import {
  dynamicDataQueryOptions,
  staticDataQueryOptions,
} from "@/lib/react-query/queryDefaults";
import { handleError } from "@/lib/auth/errorHandler";

export interface Empleado {
  id: number;
  personaId: number;
  usuarioId: number | null;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  username: string | null; // Nombre de usuario para login
  telefono: string | null;
  direccion: string | null;
  localidadId: number | null;
  localidad: string | null;
  departamentoId?: number | null;
  provinciaId?: number | null;
  rolId: number | null;
  rolNombre: string | null;
  rolTipo?: "ADMINISTRADOR" | "EMPLEADO" | null;
  estado: "Activo" | "Invitado" | "Suspendido";
  legajo: string | null;
  dni: string | null;
  ultimaActividad: string | null;
}

export interface Rol {
  id: number;
  nombre: string;
  usuarios: number;
  tipo: "ADMINISTRADOR" | "EMPLEADO";
  descripcion?: string | null;
  permisos?: string[];
}

export interface Localidad {
  Id: number;
  Descripcion: string;
  DepartamentoId: number;
}

export interface Provincia {
  Id: number;
  Descripcion: string;
}

export interface Departamento {
  Id: number;
  Descripcion: string;
  ProvinciaId: number;
}

export interface Auditoria {
  id: number;
  accion: string;
  fecha: string;
  severidad?: string;
  [key: string]: unknown;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface EmpleadosResponse {
  empleados: Empleado[];
  pagination: PaginationInfo;
}

export interface EmpleadosFilters {
  busqueda?: string;
  rol?: string;
  estado?: string;
  tenantId?: string | null;
}

// Fetch functions
const fetchEmpleados = async ({
  signal,
  page = 1,
  limit = 20,
  filters = {},
}: {
  signal: AbortSignal;
  page?: number;
  limit?: number;
  filters?: EmpleadosFilters;
}): Promise<EmpleadosResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters.busqueda) params.append("busqueda", filters.busqueda);
  if (filters.rol && filters.rol !== "todos") params.append("rol", filters.rol);
  if (filters.estado && filters.estado !== "todos")
    params.append("estado", filters.estado);
  if (filters.tenantId) params.append("tenantId", filters.tenantId);

  const response = await fetch(`/api/empleados?${params.toString()}`, {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    // La API devuelve { error: { code, message } } o { error: "string" }
    const errorMessage =
      typeof errorData?.error === "string"
        ? errorData.error
        : errorData?.error?.message ||
          errorData?.error?.code ||
          "Error al cargar empleados";
    throw new Error(errorMessage);
  }

  const data = await response.json();
  // La API devuelve { data: [...], pagination: {...} }
  return {
    empleados: data?.data || data?.empleados || [],
    pagination: data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

const fetchRoles = async ({
  signal,
  tenantId,
}: {
  signal: AbortSignal;
  tenantId?: string | null;
}): Promise<Rol[]> => {
  const params = tenantId ? `?tenantId=${tenantId}` : "";
  const response = await fetch(`/api/roles${params}`, {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    // Si falla, retornar array vacío en lugar de lanzar error
    return [];
  }

  const data = await response.json();
  return Array.isArray(data?.roles) ? data.roles : [];
};

const fetchProvincias = async ({
  signal,
}: {
  signal: AbortSignal;
}): Promise<Provincia[]> => {
  const response = await fetch("/api/provincias", {
    signal,
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  // La API devuelve directamente un array, no un objeto con propiedad provincias
  return Array.isArray(data) ? data : [];
};

const fetchDepartamentos = async ({
  signal,
  provinciaId,
}: {
  signal: AbortSignal;
  provinciaId: string;
}): Promise<Departamento[]> => {
  const response = await fetch(
    `/api/departamentos?provinciaId=${provinciaId}`,
    {
      signal,
      cache: "no-store",
      credentials: "include",
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  // La API devuelve directamente un array, no un objeto con propiedad departamentos
  return Array.isArray(data) ? data : [];
};

const fetchLocalidades = async ({
  signal,
  departamentoId,
}: {
  signal: AbortSignal;
  departamentoId: string;
}): Promise<Localidad[]> => {
  const response = await fetch(
    `/api/localidades?departamentoId=${departamentoId}`,
    {
      signal,
      cache: "no-store",
      credentials: "include",
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  // La API devuelve directamente un array, no un objeto con propiedad localidades
  return Array.isArray(data) ? data : [];
};

const fetchAuditorias = async ({
  signal,
  page = 1,
  limit = 10,
  tenantId,
}: {
  signal: AbortSignal;
  page?: number;
  limit?: number;
  tenantId?: string | null;
}): Promise<{ auditorias: Auditoria[]; pagination: PaginationInfo }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (tenantId) params.append("tenantId", tenantId);

  const response = await fetch(
    `/api/auditoria-empleados?${params.toString()}`,
    {
      signal,
      cache: "no-store",
      credentials: "include",
    }
  );

  if (!response.ok) {
    return {
      auditorias: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const data = await response.json();
  // La API devuelve { data: [...], pagination: {...} } usando createPaginationResponse
  return {
    auditorias: data?.data || data?.auditorias || [],
    pagination: data?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

// Mutation functions
const createEmpleado = async (empleadoData: {
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  telefono?: string;
  direccion?: string;
  localidadId?: string;
  departamentoId?: number | null;
  provinciaId?: number | null;
  dni?: string;
  password?: string;
  rolId?: number | undefined;
  tenantId?: string | null;
}): Promise<Empleado> => {
  const tenantParam = empleadoData.tenantId
    ? `?tenantId=${empleadoData.tenantId}`
    : "";
  const { tenantId, localidadId, rolId, ...rest } = empleadoData;
  void tenantId; // Silence unused variable warning

  // Transformar al formato que espera el API
  const body = {
    ...rest,
    localidadId: localidadId ? Number(localidadId) : undefined,
    rolId: rolId,
  };

  const response = await fetch(`/api/empleados${tenantParam}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al crear empleado");
  }

  const data = await response.json();
  return data?.empleado;
};

const updateEmpleado = async ({
  id,
  data: empleadoData,
  tenantId,
}: {
  id: number;
  data: Partial<Empleado>;
  tenantId?: string | null;
}): Promise<Empleado> => {
  const tenantParam = tenantId ? `?tenantId=${tenantId}` : "";

  // La API espera personaId en el body, no en la URL
  const body = {
    ...empleadoData,
    personaId: id,
  };

  const response = await fetch(`/api/empleados${tenantParam}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    // La API devuelve { error: { code, message } } o { error: "string" }
    const errorMessage =
      typeof errorData?.error === "string"
        ? errorData.error
        : errorData?.error?.message ||
          errorData?.error?.code ||
          "Error al actualizar empleado";
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data?.empleado;
};

const deleteEmpleado = async ({
  id,
  tenantId,
}: {
  id: number;
  tenantId?: string | null;
}): Promise<void> => {
  const tenantParam = tenantId ? `?tenantId=${tenantId}` : "";

  const response = await fetch(`/api/empleados${tenantParam}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ personaId: id }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al eliminar empleado");
  }
};

const changePassword = async ({
  usuarioId,
  nuevaPassword,
  tenantId,
}: {
  usuarioId: number;
  nuevaPassword: string;
  tenantId?: string | null;
}): Promise<void> => {
  const tenantParam = tenantId ? `?tenantId=${tenantId}` : "";

  const response = await fetch(
    `/api/empleados/cambiar-password${tenantParam}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ usuarioId, nuevaPassword }),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al cambiar contraseña");
  }
};

const createRol = async ({
  rolData,
  tenantId,
}: {
  rolData: {
    nombre: string;
    descripcion?: string;
    permisos: string[];
    tipo: "ADMINISTRADOR" | "EMPLEADO";
  };
  tenantId?: string | null;
}): Promise<Rol> => {
  const tenantParam = tenantId ? `?tenantId=${tenantId}` : "";

  const response = await fetch(`/api/roles${tenantParam}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(rolData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al crear rol");
  }

  const data = await response.json();
  return data?.rol;
};

const updateRol = async ({
  id,
  rolData,
  tenantId,
}: {
  id: number;
  rolData: Partial<Rol>;
  tenantId?: string | null;
}): Promise<Rol> => {
  const params = new URLSearchParams({ id: id.toString() });
  if (tenantId) params.append("tenantId", tenantId);

  const response = await fetch(`/api/roles?${params.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(rolData),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al actualizar rol");
  }

  const data = await response.json();
  return data?.rol;
};

const deleteRol = async ({
  id,
  tenantId,
}: {
  id: number;
  tenantId?: string | null;
}): Promise<void> => {
  const params = new URLSearchParams({ id: id.toString() });
  if (tenantId) params.append("tenantId", tenantId);

  const response = await fetch(`/api/roles?${params.toString()}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error desconocido" }));
    throw new Error(error?.error || "Error al eliminar rol");
  }
};

// Hook principal
export function useEmpleados({
  page = 1,
  limit = 20,
  filters = {},
  tenantId,
  enabled = true,
  auditoriaPage = 1,
  auditoriaLimit = 10,
}: {
  page?: number;
  limit?: number;
  filters?: EmpleadosFilters;
  tenantId?: string | null;
  enabled?: boolean;
  auditoriaPage?: number;
  auditoriaLimit?: number;
}) {
  const queryClient = useQueryClient();

  // Queries
  const empleadosQuery = useQuery({
    queryKey: [
      "empleados",
      page,
      limit,
      filters.busqueda,
      filters.rol,
      filters.estado,
      tenantId,
    ],
    queryFn: ({ signal }) =>
      fetchEmpleados({
        signal,
        page,
        limit,
        filters: { ...filters, tenantId },
      }),
    enabled,
    ...dynamicDataQueryOptions,
  });

  const rolesQuery = useQuery({
    queryKey: ["roles", tenantId],
    queryFn: ({ signal }) => fetchRoles({ signal, tenantId }),
    enabled,
    ...staticDataQueryOptions,
  });

  const provinciasQuery = useQuery({
    queryKey: ["provincias"],
    queryFn: ({ signal }) => fetchProvincias({ signal }),
    enabled,
    ...staticDataQueryOptions,
    staleTime: 30 * 60 * 1000, // 30 minutos - las provincias nunca cambian
    gcTime: 60 * 60 * 1000, // 1 hora - mantener en cache mucho tiempo
  });

  const auditoriasQuery = useQuery({
    queryKey: ["auditorias", auditoriaPage, auditoriaLimit, tenantId],
    queryFn: ({ signal }) =>
      fetchAuditorias({
        signal,
        page: auditoriaPage,
        limit: auditoriaLimit,
        tenantId,
      }),
    enabled: enabled,
    ...dynamicDataQueryOptions,
    staleTime: 10 * 1000, // 10 segundos - las auditorías pueden cambiar más frecuentemente
  });

  // Mutations
  const createEmpleadoMutation = useMutation({
    mutationFn: createEmpleado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      addToast({
        title: "Empleado creado",
        description: "El empleado fue creado correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear empleado");
    },
  });

  const updateEmpleadoMutation = useMutation({
    mutationFn: updateEmpleado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      addToast({
        title: "Empleado actualizado",
        description: "El empleado fue actualizado correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear empleado");
    },
  });

  const deleteEmpleadoMutation = useMutation({
    mutationFn: deleteEmpleado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      addToast({
        title: "Empleado eliminado",
        description: "El empleado fue eliminado correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear empleado");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      addToast({
        title: "Contraseña actualizada",
        description: "La contraseña fue cambiada correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear empleado");
    },
  });

  const createRolMutation = useMutation({
    mutationFn: createRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      addToast({
        title: "Rol creado",
        description: "El rol fue creado correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear empleado");
    },
  });

  const updateRolMutation = useMutation({
    mutationFn: updateRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      addToast({
        title: "Rol actualizado",
        description: "El rol fue actualizado correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear empleado");
    },
  });

  const deleteRolMutation = useMutation({
    mutationFn: deleteRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["auditorias"] });
      addToast({
        title: "Rol eliminado",
        description: "El rol fue eliminado correctamente.",
        color: "success",
      });
    },
    onError: (error: Error) => {
      handleError(error, "Error al crear empleado");
    },
  });

  // Helper hook para departamentos (depende de provinciaId)
  const useDepartamentos = (provinciaId: string | null) => {
    return useQuery({
      queryKey: ["departamentos", provinciaId],
      queryFn: ({ signal }) =>
        fetchDepartamentos({ signal, provinciaId: provinciaId! }),
      enabled: !!provinciaId,
      ...staticDataQueryOptions,
      staleTime: 30 * 60 * 1000, // 30 minutos - los departamentos nunca cambian
    });
  };

  // Helper hook para localidades (depende de departamentoId)
  const useLocalidades = (departamentoId: string | null) => {
    return useQuery({
      queryKey: ["localidades", departamentoId],
      queryFn: ({ signal }) =>
        fetchLocalidades({ signal, departamentoId: departamentoId! }),
      enabled: !!departamentoId,
      ...staticDataQueryOptions,
      staleTime: 30 * 60 * 1000, // 30 minutos - las localidades nunca cambian
    });
  };

  return {
    // Data
    empleados: empleadosQuery.data?.empleados || [],
    pagination: empleadosQuery.data?.pagination,
    roles: rolesQuery.data || [],
    provincias: provinciasQuery.data || [],
    auditorias: auditoriasQuery.data?.auditorias || [],
    auditoriasPagination: auditoriasQuery.data?.pagination,

    // Loading states
    isLoadingEmpleados: empleadosQuery.isLoading,
    isLoadingRoles: rolesQuery.isLoading,
    isLoadingProvincias: provinciasQuery.isLoading,
    isLoadingAuditorias: auditoriasQuery.isLoading,

    // Error states
    errorEmpleados: empleadosQuery.error,
    errorRoles: rolesQuery.error,
    errorProvincias: provinciasQuery.error,
    errorAuditorias: auditoriasQuery.error,

    // Refetch functions
    refetchEmpleados: empleadosQuery.refetch,
    refetchRoles: rolesQuery.refetch,
    refetchProvincias: provinciasQuery.refetch,
    refetchAuditorias: auditoriasQuery.refetch,

    // Mutations
    createEmpleado: createEmpleadoMutation.mutate,
    updateEmpleado: updateEmpleadoMutation.mutate,
    deleteEmpleado: deleteEmpleadoMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    createRol: createRolMutation.mutate,
    updateRol: updateRolMutation.mutate,
    deleteRol: deleteRolMutation.mutate,

    // Mutation states
    isCreatingEmpleado: createEmpleadoMutation.isPending,
    isUpdatingEmpleado: updateEmpleadoMutation.isPending,
    isDeletingEmpleado: deleteEmpleadoMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isCreatingRol: createRolMutation.isPending,
    isUpdatingRol: updateRolMutation.isPending,
    isDeletingRol: deleteRolMutation.isPending,

    // Helper hooks
    useDepartamentos,
    useLocalidades,
  };
}
