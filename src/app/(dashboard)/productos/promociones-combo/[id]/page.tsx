"use client";

import { useRouter, useParams } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import ComboForm from "@/components/productos/ComboForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Producto } from "@/lib/validations/producto.schema";
import { handleError } from "@/lib/auth/errorHandler";

export default function EditarComboPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const editMutation = useMutation({
    mutationFn: async (data: Partial<Producto>) => {
      const payload = { ...data, Id: Number(id) };
      const res = await fetch("/api/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || "Error al actualizar combo");
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Combo actualizado correctamente",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["combos-generic"] });
      queryClient.invalidateQueries({ queryKey: ["producto-detail", Number(id)] });
      router.back();
    },
    onError: (error: any) => {
      handleError(error, "Error al actualizar combo");
    },
  });

  if (!id) return null;

  return (
    <main className="min-h-full sm:p-6 space-y-4 flex flex-col">
      <div className="flex items-center">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.back()}
          className="text-slate-600 px-0 hover:bg-transparent hover:text-slate-900 ml-4 sm:ml-0"
        >
          Volver a Combos
        </Button>
      </div>

      <div className="flex-1 w-full">
        <ComboForm
          initialData={{ Id: Number(id) } as any}
          onSubmit={(data) => editMutation.mutate(data)}
          isSaving={editMutation.isPending}
          onCancel={() => router.back()}
        />
      </div>
    </main>
  );
}
