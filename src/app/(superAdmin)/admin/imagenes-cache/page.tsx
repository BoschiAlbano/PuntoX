"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardBody,
  Input,
  Button,
  Chip,
  Spinner,
  addToast,
} from "@heroui/react";
import { ImageIcon, Search, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import ConfirmModal from "@/components/shared/ConfirmModal";

interface ImagenCache {
  Id: number;
  CodigoBarra: string;
  Descripcion: string | null;
  ImageUrl: string;
  Fuente: "OPEN_FOOD_FACTS" | "USUARIO";
  FechaCreacion: string;
}

interface ListResponse {
  data: ImagenCache[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = (reader.result as string) || "";
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImagenesCachePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entradaAEliminar, setEntradaAEliminar] = useState<ImagenCache | null>(null);
  const reemplazandoIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery<ListResponse>({
    queryKey: ["admin-imagenes-cache", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ q: search, page: String(page), limit: "12" });
      const res = await fetch(`/api/admin/imagenes-cache?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar el caché de imágenes");
      return res.json();
    },
  });

  const reemplazarMutation = useMutation({
    mutationFn: async ({ id, imageBase64 }: { id: number; imageBase64: string }) => {
      const res = await fetch(`/api/admin/imagenes-cache/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Error al reemplazar la imagen");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-imagenes-cache"] });
      addToast({ title: "Imagen reemplazada", color: "success", timeout: 3000 });
    },
    onError: (error: any) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
        timeout: 4000,
      });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/imagenes-cache/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "Error al eliminar la entrada");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-imagenes-cache"] });
      addToast({ title: "Entrada eliminada", color: "success", timeout: 3000 });
      setEntradaAEliminar(null);
    },
    onError: (error: any) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
        timeout: 4000,
      });
    },
  });

  const handleReemplazarClick = (id: number) => {
    reemplazandoIdRef.current = id;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = reemplazandoIdRef.current;
    e.target.value = "";
    if (!file || !id) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast({
        title: "Archivo muy grande",
        description: "Máximo 2MB",
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    const imageBase64 = await fileToBase64(file);
    reemplazarMutation.mutate({ id, imageBase64 });
  };

  const entradas = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0F2233] flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Caché de imágenes de producto
          </h1>
          <p className="text-sm text-slate-500">
            Imágenes compartidas entre todos los tenants, indexadas por código de barra.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border border-slate-200/60 bg-white">
        <CardBody className="p-4">
          <Input
            placeholder="Buscar por código de barra o descripción..."
            value={search}
            onValueChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            startContent={<Search size={16} className="text-slate-400" />}
            variant="bordered"
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
          />
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Cargando..." color="primary" />
        </div>
      ) : entradas.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-16">
          No hay entradas en el caché{search ? " para esa búsqueda" : ""}.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {entradas.map((entrada) => (
            <Card key={entrada.Id} className="shadow-sm border border-slate-200/60 bg-white">
              <CardBody className="p-4 space-y-3">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                  <Image
                    src={entrada.ImageUrl}
                    alt={entrada.Descripcion || entrada.CodigoBarra}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  <Chip
                    size="sm"
                    className={`absolute top-2 left-2 text-white ${
                      entrada.Fuente === "USUARIO" ? "bg-[#67afc3]" : "bg-slate-600"
                    }`}
                  >
                    {entrada.Fuente === "USUARIO" ? "Comunidad PuntoX" : "Open Food Facts"}
                  </Chip>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {entrada.Descripcion || "Sin descripción"}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{entrada.CodigoBarra}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    startContent={<RefreshCw size={14} />}
                    isLoading={
                      reemplazarMutation.isPending &&
                      reemplazandoIdRef.current === entrada.Id
                    }
                    onPress={() => handleReemplazarClick(entrada.Id)}
                  >
                    Reemplazar
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    isIconOnly
                    onPress={() => setEntradaAEliminar(entrada)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            isDisabled={!pagination.hasPreviousPage}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-slate-600">
            Página {pagination.page} de {pagination.totalPages}
            {isFetching ? "…" : ""}
          </span>
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            isDisabled={!pagination.hasNextPage}
            onPress={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!entradaAEliminar}
        onClose={() => setEntradaAEliminar(null)}
        onConfirm={() => entradaAEliminar && eliminarMutation.mutate(entradaAEliminar.Id)}
        title="Eliminar imagen del caché"
        description={`¿Eliminar la imagen de "${entradaAEliminar?.Descripcion || entradaAEliminar?.CodigoBarra}"? Esta acción no se puede deshacer.`}
        isLoading={eliminarMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
