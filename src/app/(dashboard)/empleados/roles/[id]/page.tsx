"use client";

import { useRouter, useParams } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import RolForm, { type RolItem } from "@/components/empleados/RolForm";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { handleError } from "@/lib/auth/errorHandler";
import { LoadingComponent } from "@/components/loading/loading";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";
import { useEffect } from "react";

export default function EditarRolPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const { data: rol, isLoading } = useQuery({
    queryKey: ["rol", id],
    queryFn: async () => {
      const res = await fetch(`/api/roles?editId=${id}`);
      if (!res.ok) throw new Error("Error fetching rol");
      const data = await res.json();
      return data.data?.[0] || null;
    },
    enabled: !!id,
  });

  const { setOverride } = useBreadcrumbStore();

  useEffect(() => {
    if (rol) {
      setOverride(`/empleados/roles/${id}`, rol.nombre || "Rol");
    }
  }, [rol, id, setOverride]);

  const editMutation = useMutation({
    mutationFn: async (data: Partial<RolItem>) => {
      const payload = { ...data, Id: Number(id) };
      const res = await fetch("/api/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || err?.message || "Error al actualizar rol",
        );
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Rol actualizado correctamente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["roles-generic"] });
      queryClient.invalidateQueries({ queryKey: ["roles-crud"] });
      queryClient.invalidateQueries({ queryKey: ["roles-select"] });
      queryClient.invalidateQueries({ queryKey: ["rol", id] });
      router.push("/empleados/roles");
    },
    onError: (error: any) => {
      handleError(error, "Error al actualizar rol");
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

      <div className="flex-1 w-full">
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <LoadingComponent message="Cargando detalles..." />
          </div>
        )}
        {!isLoading && !rol ? (
          <div className="text-slate-500 flex justify-center py-10">No se encontró el rol.</div>
        ) : (
          <RolForm
            initialData={rol || null}
            onSubmit={(data) => editMutation.mutate(data)}
            isSaving={editMutation.isPending}
            onCancel={() => router.push("/empleados/roles")}
          />
        )}
      </div>
    </main>
  );
}
