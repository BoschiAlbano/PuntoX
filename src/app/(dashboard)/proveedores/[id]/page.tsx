"use client";

import { useRouter, useParams } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import FormularioProveedor from "@/components/proveedores/FormularioProveedor";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Proveedor } from "@/lib/validations/proveedor.schema";
import { handleError } from "@/lib/auth/errorHandler";

export default function EditarProveedorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const { data: proveedor, isLoading } = useQuery({
    queryKey: ["proveedor", id],
    queryFn: async () => {
      const res = await fetch(`/api/proveedores?Id=${id}`);
      if (!res.ok) throw new Error("Error fetching proveedor");
      const data = await res.json();
      return data.data?.[0] || null;
    },
    enabled: !!id,
  });

  const editMutation = useMutation({
    mutationFn: async (data: Partial<Proveedor>) => {
      const payload = { ...data, Id: Number(id) };
      const res = await fetch("/api/proveedores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || "Error al actualizar proveedor");
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Proveedor actualizado correctamente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["proveedores-generic"] });
      queryClient.invalidateQueries({ queryKey: ["proveedor", id] });
      router.push("/proveedores");
    },
    onError: (error: any) => {
      handleError(error, "Error al actualizar proveedor");
    },
  });

  return (
    <main className="min-h-full sm:p-6 space-y-4 flex flex-col">
      <div className="flex items-center">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/proveedores")}
          className="text-slate-600 px-0 hover:bg-transparent hover:text-slate-900 ml-4 sm:ml-0"
        >
          Volver a proveedores
        </Button>
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Cargando proveedor...
          </div>
        ) : !proveedor ? (
          <div className="text-slate-500">No se encontró el proveedor.</div>
        ) : (
          <FormularioProveedor
            initialData={proveedor}
            onSubmit={(data) => editMutation.mutate(data)}
            isSaving={editMutation.isPending}
            onCancel={() => router.push("/proveedores")}
          />
        )}
      </div>
    </main>
  );
}
