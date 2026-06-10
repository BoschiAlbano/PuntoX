"use client";

import { useRouter, useParams } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import ClienteForm from "@/components/clientes/ClienteForm";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Cliente } from "@/lib/validations/cliente.schema";
import { handleError } from "@/lib/auth/errorHandler";

export default function EditarClientePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const { data: cliente, isLoading } = useQuery({
    queryKey: ["cliente", id],
    queryFn: async () => {
      const res = await fetch(`/api/clientes?Id=${id}`);
      if (!res.ok) throw new Error("Error fetching cliente");
      const data = await res.json();
      return data.data?.[0] || null;
    },
    enabled: !!id,
  });

  const editMutation = useMutation({
    mutationFn: async (data: Partial<Cliente>) => {
      const payload = { ...data, Id: Number(id) };
      const res = await fetch("/api/clientes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || "Error al actualizar cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Cliente actualizado correctamente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["clientes-generic"] });
      queryClient.invalidateQueries({ queryKey: ["cliente", id] });
      router.push("/clientes");
    },
    onError: (error: any) => {
      handleError(error, "Error al actualizar cliente");
    },
  });

  return (
    <main className="min-h-full sm:p-6 space-y-4 flex flex-col">
      <div className="flex items-center">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/clientes")}
          className="text-slate-600 px-0 hover:bg-transparent hover:text-slate-900 ml-4 sm:ml-0"
        >
          Volver a clientes
        </Button>
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Cargando cliente...
          </div>
        ) : !cliente ? (
          <div className="text-slate-500">No se encontró el cliente.</div>
        ) : (
          <ClienteForm
            initialData={cliente}
            onSubmit={(data) => editMutation.mutate(data)}
            isSaving={editMutation.isPending}
            onCancel={() => router.push("/clientes")}
          />
        )}
      </div>
    </main>
  );
}
