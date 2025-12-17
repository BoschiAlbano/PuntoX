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
  Tooltip,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import Pagination, { PaginationInfo } from "@/components/common/Pagination";

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  dni: string | null;
  direccion: string;
  telefono: string | null;
  mail: string;
  localidadId: number;
  localidad: string | null;
  departamento: string | null;
  provincia: string | null;
  condicionIvaId: number;
  condicionIva: string | null;
  activarCtaCte: boolean;
  tieneLimiteCompra: boolean;
  montoMaximoCtaCte: number;
};

type CondicionIva = {
  id: number;
  descripcion: string;
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

type Localidad = {
  Id: number;
  Descripcion: string;
  DepartamentoId: number;
};

type NuevoCliente = {
  nombre: string;
  apellido: string;
  dni: string;
  direccion: string;
  telefono: string;
  mail: string;
  localidadId: string;
  condicionIvaId: string;
  activarCtaCte: boolean;
  tieneLimiteCompra: boolean;
  montoMaximoCtaCte: string;
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [condicionesIva, setCondicionesIva] = useState<CondicionIva[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSavingCliente, setIsSavingCliente] = useState(false);
  const [isDeletingCliente, setIsDeletingCliente] = useState(false);
  const [busqueda, setBusqueda] = useState("");
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
  const [openModalCrear, setOpenModalCrear] = useState(false);
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [openModalEliminar, setOpenModalEliminar] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");
  const [nuevoCliente, setNuevoCliente] = useState<NuevoCliente>({
    nombre: "",
    apellido: "",
    dni: "",
    direccion: "",
    telefono: "",
    mail: "",
    localidadId: "",
    condicionIvaId: "",
    activarCtaCte: false,
    tieneLimiteCompra: false,
    montoMaximoCtaCte: "0",
  });

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (busqueda.trim()) {
        params.append("q", busqueda.trim());
      }

      const [clientesRes, condicionesRes, provinciasRes] = await Promise.all([
        fetch(`/api/clientes?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/condiciones-iva", { cache: "no-store" }),
        fetch("/api/provincias", { cache: "no-store" }),
      ]);

      if (clientesRes.ok) {
        const clientesData = await clientesRes.json();
        // Manejar respuesta paginada o formato antiguo
        if (clientesData?.data && clientesData?.pagination) {
          setClientes(clientesData.data);
          setPagination(clientesData.pagination);
        } else if (Array.isArray(clientesData?.clientes)) {
          // Formato antiguo (retrocompatibilidad)
          setClientes(clientesData.clientes);
          setPagination({
            page: 1,
            limit: clientesData.clientes.length,
            total: clientesData.clientes.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        } else {
          setClientes([]);
        }
      } else {
        addToast({
          title: "Error",
          description: "No se pudieron cargar los clientes",
          color: "warning",
        });
      }

      if (condicionesRes.ok) {
        const condicionesData = await condicionesRes.json();
        setCondicionesIva(
          Array.isArray(condicionesData?.condicionesIva)
            ? condicionesData.condicionesIva
            : []
        );
      }

      if (provinciasRes.ok) {
        const provinciasData = await provinciasRes.json();
        setProvincias(Array.isArray(provinciasData) ? provinciasData : []);
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: "Error al cargar los datos",
        color: "danger",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, limit, busqueda]);

  const loadDepartamentos = async (provId: string) => {
    if (!provId) {
      setDepartamentos([]);
      return;
    }
    try {
      const res = await fetch(`/api/departamentos?provinciaId=${provId}`);
      if (!res.ok) throw new Error("No se pudieron cargar departamentos");
      const data = await res.json();
      setDepartamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setDepartamentos([]);
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
      setNuevoCliente((prev) => ({ ...prev, localidadId: "" }));
    } else {
      setDepartamentos([]);
      setLocalidades([]);
    }
  }, [provinciaSeleccionada]);

  useEffect(() => {
    if (departamentoSeleccionado) {
      loadLocalidades(departamentoSeleccionado);
      setNuevoCliente((prev) => ({ ...prev, localidadId: "" }));
    } else {
      setLocalidades([]);
    }
  }, [departamentoSeleccionado]);

  // La búsqueda ahora se hace en el servidor, no necesitamos filtrar en el cliente
  const clientesFiltrados = clientes;

  const handleCrearCliente = async () => {
    if (
      !nuevoCliente.nombre.trim() ||
      !nuevoCliente.apellido.trim() ||
      !nuevoCliente.mail.trim() ||
      !nuevoCliente.direccion.trim() ||
      !nuevoCliente.localidadId ||
      !nuevoCliente.condicionIvaId
    ) {
      addToast({
        title: "Faltan datos",
        description: "Completa los campos obligatorios para crear el cliente.",
        color: "warning",
      });
      return;
    }

    setIsSavingCliente(true);
    try {
      const body = {
        nombre: nuevoCliente.nombre.trim(),
        apellido: nuevoCliente.apellido.trim(),
        dni: nuevoCliente.dni.trim() || undefined,
        direccion: nuevoCliente.direccion.trim(),
        telefono: nuevoCliente.telefono.trim() || undefined,
        email: nuevoCliente.mail.trim(),
        localidadId: Number(nuevoCliente.localidadId),
        condicionIvaId: Number(nuevoCliente.condicionIvaId),
        activarCtaCte: nuevoCliente.activarCtaCte,
        tieneLimiteCompra: nuevoCliente.tieneLimiteCompra,
        montoMaximoCtaCte: nuevoCliente.tieneLimiteCompra
          ? Number(nuevoCliente.montoMaximoCtaCte) || 0
          : 0,
      };

      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errorMessage = data?.error ?? "No se pudo crear el cliente";
        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        return;
      }

      const data = await res.json();
      if (data?.cliente) {
        // Recargar datos para actualizar la paginación
        loadData();
      }

      addToast({
        title: "Cliente creado",
        description: `${data.cliente.nombreCompleto} fue agregado correctamente.`,
        color: "success",
      });

      setOpenModalCrear(false);
      setNuevoCliente({
        nombre: "",
        apellido: "",
        dni: "",
        direccion: "",
        telefono: "",
        mail: "",
        localidadId: "",
        condicionIvaId: "",
        activarCtaCte: false,
        tieneLimiteCompra: false,
        montoMaximoCtaCte: "0",
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
      setIsSavingCliente(false);
    }
  };

  const handleEditarCliente = async () => {
    if (!clienteAEditar) return;

    if (
      !nuevoCliente.nombre.trim() ||
      !nuevoCliente.apellido.trim() ||
      !nuevoCliente.mail.trim() ||
      !nuevoCliente.direccion.trim() ||
      !nuevoCliente.localidadId ||
      !nuevoCliente.condicionIvaId
    ) {
      addToast({
        title: "Faltan datos",
        description: "Completa los campos obligatorios.",
        color: "warning",
      });
      return;
    }

    setIsSavingCliente(true);
    try {
      const body: {
        nombre: string;
        apellido: string;
        dni?: string;
        telefono?: string;
        email?: string;
        direccion?: string;
        localidadId?: number;
        condicionIvaId: number;
        activarCtaCte: boolean;
        tieneLimiteCompra: boolean;
        limiteCompra?: number;
      } = {
        nombre: nuevoCliente.nombre.trim(),
        apellido: nuevoCliente.apellido.trim(),
        dni: nuevoCliente.dni.trim() || undefined,
        direccion: nuevoCliente.direccion.trim(),
        telefono: nuevoCliente.telefono.trim() || undefined,
        email: nuevoCliente.mail.trim(),
        localidadId: Number(nuevoCliente.localidadId),
        condicionIvaId: Number(nuevoCliente.condicionIvaId),
        activarCtaCte: nuevoCliente.activarCtaCte,
        tieneLimiteCompra: nuevoCliente.tieneLimiteCompra,
        limiteCompra: nuevoCliente.tieneLimiteCompra
          ? Number(nuevoCliente.montoMaximoCtaCte) || 0
          : undefined,
      };

      const res = await fetch(`/api/clientes?id=${clienteAEditar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errorMessage = data?.error ?? "No se pudo actualizar el cliente";
        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        return;
      }

      const data = await res.json();
      if (data?.cliente) {
        setClientes((prev) =>
          prev.map((c) => (c.id === clienteAEditar.id ? data.cliente : c))
        );
      }

      addToast({
        title: "Cliente actualizado",
        description: `${data.cliente.nombreCompleto} fue actualizado correctamente.`,
        color: "success",
      });

      setOpenModalEditar(false);
      setClienteAEditar(null);
      setNuevoCliente({
        nombre: "",
        apellido: "",
        dni: "",
        direccion: "",
        telefono: "",
        mail: "",
        localidadId: "",
        condicionIvaId: "",
        activarCtaCte: false,
        tieneLimiteCompra: false,
        montoMaximoCtaCte: "0",
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
      setIsSavingCliente(false);
    }
  };

  const handleEliminarCliente = async () => {
    if (!clienteAEliminar) return;

    setIsDeletingCliente(true);
    try {
      const res = await fetch(`/api/clientes?id=${clienteAEliminar.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errorMessage = data?.error ?? "No se pudo eliminar el cliente";
        addToast({
          title: "Error",
          description: errorMessage,
          color: "danger",
        });
        return;
      }

      setClientes((prev) => prev.filter((c) => c.id !== clienteAEliminar.id));

      addToast({
        title: "Cliente eliminado",
        description: `${clienteAEliminar.nombreCompleto} fue eliminado correctamente.`,
        color: "success",
      });

      setOpenModalEliminar(false);
      setClienteAEliminar(null);
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error",
        description: (error as Error).message,
        color: "danger",
      });
    } finally {
      setIsDeletingCliente(false);
    }
  };

  const abrirModalEditar = (cliente: Cliente) => {
    setClienteAEditar(cliente);
    setNuevoCliente({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      dni: cliente.dni || "",
      direccion: cliente.direccion,
      telefono: cliente.telefono || "",
      mail: cliente.mail,
      localidadId: String(cliente.localidadId),
      condicionIvaId: String(cliente.condicionIvaId),
      activarCtaCte: cliente.activarCtaCte,
      tieneLimiteCompra: cliente.tieneLimiteCompra,
      montoMaximoCtaCte: String(cliente.montoMaximoCtaCte),
    });
    // Cargar provincia y departamento basado en la localidad del cliente
    // Esto requeriría una API adicional o cargar desde el cliente
    setOpenModalEditar(true);
  };

  const resumen = useMemo(
    () => ({
      total: clientes.length,
      conCtaCte: clientes.filter((c) => c.activarCtaCte).length,
    }),
    [clientes]
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu base de clientes y configuración de cuenta corriente
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm border border-slate-200">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Total de clientes</p>
            <p className="text-2xl font-bold text-slate-900">{resumen.total}</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-slate-200">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Con cuenta corriente</p>
            <p className="text-2xl font-bold text-slate-900">
              {resumen.conCtaCte}
            </p>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-slate-200">
          <CardBody className="p-4">
            <p className="text-sm text-gray-500">Sin cuenta corriente</p>
            <p className="text-2xl font-bold text-slate-900">
              {resumen.total - resumen.conCtaCte}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Alta rápida y tabla */}
      <Card className="shadow-sm border border-slate-200 mb-6">
        <CardHeader className="flex flex-col gap-3 pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full">
            <div>
              <p className="text-sm text-gray-500">Clientes</p>
              <h2 className="text-xl font-semibold text-slate-900">
                Base de clientes
              </h2>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto md:items-center">
              <Input
                size="sm"
                placeholder="Buscar por nombre, email, DNI o teléfono"
                startContent={<span className="text-gray-500">🔍</span>}
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPage(1); // Resetear a página 1 al buscar
                }}
                className="w-full md:max-w-xs"
              />
              <Button
                size="sm"
                color="primary"
                startContent={<UserPlus size={16} />}
                onPress={() => setOpenModalCrear(true)}
              >
                Nuevo cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-3 pt-4">
          {clientesFiltrados.map((cliente) => (
            <div
              key={cliente.id}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm sm:text-base">
                    {cliente.nombreCompleto}
                  </span>
                  {cliente.condicionIva && (
                    <Chip size="sm" color="primary" variant="flat">
                      {cliente.condicionIva}
                    </Chip>
                  )}
                  {cliente.activarCtaCte && (
                    <Chip size="sm" color="success" variant="flat">
                      Cuenta corriente
                    </Chip>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {cliente.localidad && (
                    <>
                      📍 {cliente.localidad}
                      {cliente.departamento && `, ${cliente.departamento}`}
                      {cliente.provincia && `, ${cliente.provincia}`}
                    </>
                  )}
                  {!cliente.localidad && "📍 Localidad pendiente"}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                  {cliente.mail && (
                    <span className="flex items-center gap-1">
                      ✉️ {cliente.mail}
                    </span>
                  )}
                  {cliente.telefono && (
                    <span className="flex items-center gap-1">
                      📞 {cliente.telefono}
                    </span>
                  )}
                  {cliente.dni && (
                    <span className="flex items-center gap-1">🆔 {cliente.dni}</span>
                  )}
                </div>
                {cliente.activarCtaCte && cliente.tieneLimiteCompra && (
                  <p className="text-xs text-gray-500 mt-1">
                    Límite: ${cliente.montoMaximoCtaCte.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Tooltip content="Editar">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => abrirModalEditar(cliente)}
                  >
                    <Pencil size={16} />
                  </Button>
                </Tooltip>
                <Tooltip content="Eliminar">
                  <Button
                    isIconOnly
                    size="sm"
                    color="danger"
                    variant="light"
                    onPress={() => {
                      setClienteAEliminar(cliente);
                      setOpenModalEliminar(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </Tooltip>
              </div>
            </div>
          ))}
          {clientesFiltrados.length === 0 && (
            <p className="text-sm text-gray-500 px-2 py-4 text-center">
              {isLoadingData ? "Cargando..." : "No hay clientes registrados"}
            </p>
          )}
        </CardBody>
        
        {/* Paginación */}
        {pagination.total > 0 && (
          <div className="p-4 border-t border-gray-200">
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

      {/* Modal Crear Cliente */}
      <Modal
        isOpen={openModalCrear}
        onClose={() => setOpenModalCrear(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Nuevo Cliente</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                placeholder="Juan"
                value={nuevoCliente.nombre}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, nombre: e.target.value }))
                }
                isRequired
              />
              <Input
                label="Apellido *"
                placeholder="Pérez"
                value={nuevoCliente.apellido}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, apellido: e.target.value }))
                }
                isRequired
              />
              <Input
                label="DNI"
                placeholder="12345678"
                value={nuevoCliente.dni}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, dni: e.target.value }))
                }
              />
              <Input
                label="Email *"
                type="email"
                placeholder="cliente@ejemplo.com"
                value={nuevoCliente.mail}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, mail: e.target.value }))
                }
                isRequired
              />
              <Input
                label="Teléfono"
                placeholder="+54 11 1234-5678"
                value={nuevoCliente.telefono}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, telefono: e.target.value }))
                }
              />
              <Input
                label="Dirección *"
                placeholder="Calle 123"
                value={nuevoCliente.direccion}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, direccion: e.target.value }))
                }
                isRequired
              />
              <Select
                label="Provincia"
                selectedKeys={provinciaSeleccionada ? [provinciaSeleccionada] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setProvinciaSeleccionada(selected || "");
                }}
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
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setDepartamentoSeleccionado(selected || "");
                }}
                placeholder="Selecciona un departamento"
                isDisabled={!provinciaSeleccionada}
              >
                {departamentos.map((dept) => (
                  <SelectItem key={String(dept.Id)}>{dept.Descripcion}</SelectItem>
                ))}
              </Select>
              <Select
                label="Localidad *"
                selectedKeys={nuevoCliente.localidadId ? [nuevoCliente.localidadId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNuevoCliente((prev) => ({ ...prev, localidadId: selected || "" }));
                }}
                placeholder="Selecciona una localidad"
                isDisabled={!departamentoSeleccionado}
                isRequired
              >
                {localidades.map((loc) => (
                  <SelectItem key={String(loc.Id)}>{loc.Descripcion}</SelectItem>
                ))}
              </Select>
              <Select
                label="Condición IVA *"
                selectedKeys={
                  nuevoCliente.condicionIvaId ? [nuevoCliente.condicionIvaId] : []
                }
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNuevoCliente((prev) => ({
                    ...prev,
                    condicionIvaId: selected || "",
                  }));
                }}
                placeholder="Selecciona condición IVA"
                isRequired
              >
                {condicionesIva.map((cond) => (
                  <SelectItem key={String(cond.id)}>{cond.descripcion}</SelectItem>
                ))}
              </Select>
            </div>
            <Divider className="my-4" />
            <div className="space-y-4">
              <Switch
                isSelected={nuevoCliente.activarCtaCte}
                onValueChange={(checked) =>
                  setNuevoCliente((prev) => ({ ...prev, activarCtaCte: checked }))
                }
              >
                Activar cuenta corriente
              </Switch>
              {nuevoCliente.activarCtaCte && (
                <>
                  <Switch
                    isSelected={nuevoCliente.tieneLimiteCompra}
                    onValueChange={(checked) =>
                      setNuevoCliente((prev) => ({
                        ...prev,
                        tieneLimiteCompra: checked,
                      }))
                    }
                  >
                    Tiene límite de compra
                  </Switch>
                  {nuevoCliente.tieneLimiteCompra && (
                    <Input
                      label="Monto máximo cuenta corriente"
                      type="number"
                      placeholder="0"
                      value={nuevoCliente.montoMaximoCtaCte}
                      onChange={(e) =>
                        setNuevoCliente((prev) => ({
                          ...prev,
                          montoMaximoCtaCte: e.target.value,
                        }))
                      }
                      startContent={<span className="text-gray-500">$</span>}
                    />
                  )}
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setOpenModalCrear(false)}
              isDisabled={isSavingCliente}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleCrearCliente}
              isLoading={isSavingCliente}
            >
              Crear cliente
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal
        isOpen={openModalEditar}
        onClose={() => {
          setOpenModalEditar(false);
          setClienteAEditar(null);
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Editar Cliente</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre *"
                value={nuevoCliente.nombre}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, nombre: e.target.value }))
                }
                isRequired
              />
              <Input
                label="Apellido *"
                value={nuevoCliente.apellido}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, apellido: e.target.value }))
                }
                isRequired
              />
              <Input
                label="DNI"
                value={nuevoCliente.dni}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, dni: e.target.value }))
                }
              />
              <Input
                label="Email *"
                type="email"
                value={nuevoCliente.mail}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, mail: e.target.value }))
                }
                isRequired
              />
              <Input
                label="Teléfono"
                value={nuevoCliente.telefono}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, telefono: e.target.value }))
                }
              />
              <Input
                label="Dirección *"
                value={nuevoCliente.direccion}
                onChange={(e) =>
                  setNuevoCliente((prev) => ({ ...prev, direccion: e.target.value }))
                }
                isRequired
              />
              <Select
                label="Provincia"
                selectedKeys={provinciaSeleccionada ? [provinciaSeleccionada] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setProvinciaSeleccionada(selected || "");
                }}
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
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setDepartamentoSeleccionado(selected || "");
                }}
                placeholder="Selecciona un departamento"
                isDisabled={!provinciaSeleccionada}
              >
                {departamentos.map((dept) => (
                  <SelectItem key={String(dept.Id)}>{dept.Descripcion}</SelectItem>
                ))}
              </Select>
              <Select
                label="Localidad *"
                selectedKeys={nuevoCliente.localidadId ? [nuevoCliente.localidadId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNuevoCliente((prev) => ({ ...prev, localidadId: selected || "" }));
                }}
                placeholder="Selecciona una localidad"
                isDisabled={!departamentoSeleccionado}
                isRequired
              >
                {localidades.map((loc) => (
                  <SelectItem key={String(loc.Id)}>{loc.Descripcion}</SelectItem>
                ))}
              </Select>
              <Select
                label="Condición IVA *"
                selectedKeys={
                  nuevoCliente.condicionIvaId ? [nuevoCliente.condicionIvaId] : []
                }
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNuevoCliente((prev) => ({
                    ...prev,
                    condicionIvaId: selected || "",
                  }));
                }}
                placeholder="Selecciona condición IVA"
                isRequired
              >
                {condicionesIva.map((cond) => (
                  <SelectItem key={String(cond.id)}>{cond.descripcion}</SelectItem>
                ))}
              </Select>
            </div>
            <Divider className="my-4" />
            <div className="space-y-4">
              <Switch
                isSelected={nuevoCliente.activarCtaCte}
                onValueChange={(checked) =>
                  setNuevoCliente((prev) => ({ ...prev, activarCtaCte: checked }))
                }
              >
                Activar cuenta corriente
              </Switch>
              {nuevoCliente.activarCtaCte && (
                <>
                  <Switch
                    isSelected={nuevoCliente.tieneLimiteCompra}
                    onValueChange={(checked) =>
                      setNuevoCliente((prev) => ({
                        ...prev,
                        tieneLimiteCompra: checked,
                      }))
                    }
                  >
                    Tiene límite de compra
                  </Switch>
                  {nuevoCliente.tieneLimiteCompra && (
                    <Input
                      label="Monto máximo cuenta corriente"
                      type="number"
                      value={nuevoCliente.montoMaximoCtaCte}
                      onChange={(e) =>
                        setNuevoCliente((prev) => ({
                          ...prev,
                          montoMaximoCtaCte: e.target.value,
                        }))
                      }
                      startContent={<span className="text-gray-500">$</span>}
                    />
                  )}
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setOpenModalEditar(false);
                setClienteAEditar(null);
              }}
              isDisabled={isSavingCliente}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleEditarCliente}
              isLoading={isSavingCliente}
            >
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Eliminar Cliente */}
      <Modal
        isOpen={openModalEliminar}
        onClose={() => {
          setOpenModalEliminar(false);
          setClienteAEliminar(null);
        }}
      >
        <ModalContent>
          <ModalHeader>Eliminar Cliente</ModalHeader>
          <ModalBody>
            <p>
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong>{clienteAEliminar?.nombreCompleto}</strong>? Esta acción no se
              puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setOpenModalEliminar(false);
                setClienteAEliminar(null);
              }}
              isDisabled={isDeletingCliente}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleEliminarCliente}
              isLoading={isDeletingCliente}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
