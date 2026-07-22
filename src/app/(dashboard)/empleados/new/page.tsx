"use client";

import { useRouter } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import UsuarioForm from "@/components/empleados/UsuarioForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/lib/auth/errorHandler";
import { Usuario } from "@/components/empleados/UsuariosCRUD";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useUserStore } from "@/store/useUserStore";

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { puedeCrearUsuario, usuarios } = usePlanFeatures();
  const refreshUserData = useUserStore((s) => s.refreshUserData);

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
      refreshUserData();
      router.push("/empleados");
    },
    onError: (error: any) => {
      handleError(error, "Error al crear empleado");
    },
  });

  if (!puedeCrearUsuario) {
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
        <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 py-16">
          <div className="p-4 rounded-full bg-amber-50 border border-amber-100">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>
          <p className="text-slate-600 font-medium text-center max-w-sm">
            {usuarios.limite !== null
              ? `Tu plan permite hasta ${usuarios.limite} usuarios y ya alcanzaste ese límite.`
              : "Tu plan no permite agregar más usuarios."}{" "}
            Actualizá tu plan para agregar más.
          </p>
        </div>
      </main>
    );
  }

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
