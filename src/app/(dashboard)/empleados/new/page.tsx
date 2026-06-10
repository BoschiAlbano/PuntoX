"use client";

import { useRouter } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import UsuarioForm from "@/components/empleados/UsuarioForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/lib/auth/errorHandler";
import { Usuario } from "@/components/empleados/UsuariosCRUD";

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Usuario>) => {
      const res = await fetch("/api/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || err?.message || "Error al crear empleado",
        );
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Empleado creado correctamente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["empleados-generic"] });
      router.push("/empleados");
    },
    onError: (error: any) => {
      handleError(error, "Error al crear empleado");
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
        <UsuarioForm
          initialData={null}
          onSubmit={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
          onCancel={() => router.push("/empleados")}
        />
      </div>
    </main>
  );
}
