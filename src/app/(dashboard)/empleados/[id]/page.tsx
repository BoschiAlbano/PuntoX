"use client";

import { useRouter, useParams } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import UsuarioForm from "@/components/empleados/UsuarioForm";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { handleError } from "@/lib/auth/errorHandler";
import { Usuario } from "@/components/empleados/UsuariosCRUD";

export default function EditarEmpleadoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const { data: empleado, isLoading } = useQuery({
    queryKey: ["empleado", id],
    queryFn: async () => {
      const res = await fetch(`/api/empleados?editId=${id}`);
      if (!res.ok) throw new Error("Error fetching empleado");
      const data = await res.json();
      return data.data?.[0] || null;
    },
    enabled: !!id,
  });

  const editMutation = useMutation({
    mutationFn: async (data: Partial<Usuario>) => {
      const payload = { ...data, personaId: Number(id) };
      const res = await fetch("/api/empleados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || err?.message || "Error al actualizar empleado",
        );
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Empleado actualizado correctamente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["empleados-generic"] });
      queryClient.invalidateQueries({ queryKey: ["empleado", id] });
      router.push("/empleados");
    },
    onError: (error: any) => {
      handleError(error, "Error al actualizar empleado");
    },
  });

  return (
    <main className="min-h-full sm:p-6 space-y-4 flex flex-col">
      <div className="flex items-center">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/empleados")}
          className="text-slate-600 px-2 hover:bg-transparent hover:text-slate-900 ml-4 sm:ml-0"
        >
          Volver a empleados
        </Button>
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Cargando empleado...
          </div>
        ) : !empleado ? (
          <div className="text-slate-500">No se encontró el empleado.</div>
        ) : (
          <UsuarioForm
            initialData={empleado}
            onSubmit={(data) => editMutation.mutate(data)}
            isSaving={editMutation.isPending}
            onCancel={() => router.push("/empleados")}
          />
        )}
      </div>
    </main>
  );
}
