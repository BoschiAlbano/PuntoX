"use client";

import { useRouter } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import RolForm, { type RolItem } from "@/components/empleados/RolForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/lib/auth/errorHandler";

export default function NuevoRolPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Partial<RolItem>) => {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || "Error al crear rol");
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Rol creado correctamente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["roles-generic"] });
      queryClient.invalidateQueries({ queryKey: ["roles-crud"] });
      queryClient.invalidateQueries({ queryKey: ["roles-select"] });
      router.push("/empleados/roles");
    },
    onError: (error: any) => {
      handleError(error, "Error al crear rol");
    },
  });

  return (
    <main className="min-h-full sm:p-6 space-y-4 flex flex-col">
      <div className="flex items-center">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/empleados/roles")}
          className="text-slate-600 px-2 hover:bg-transparent hover:text-slate-900 ml-4 sm:ml-0"
        >
          Volver a roles
        </Button>
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        <RolForm
          onSubmit={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
          onCancel={() => router.push("/empleados/roles")}
        />
      </div>
    </main>
  );
}
