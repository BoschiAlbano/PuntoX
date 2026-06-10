"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Producto } from "@/lib/validations/producto.schema";
import { handleError } from "@/lib/auth/errorHandler";
import { useState } from "react";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import ComboForm from "@/components/productos/ComboForm";

export default function NuevoComboPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formKey, setFormKey] = useState(0);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Producto>) => {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || "Error al crear combo");
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Combo creado correctamente. Puedes cargar el siguiente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["combos-generic"] });
      setFormKey((prev) => prev + 1);
    },
    onError: (error: any) => {
      handleError(error, "Error al crear combo");
    },
  });

  return (
    <main className="min-h-full sm:p-6 space-y-4 flex flex-col">
      <div className="flex items-center">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/productos/promociones-combo")}
          className="text-slate-600 px-0 hover:bg-transparent hover:text-slate-900 ml-4 sm:ml-0"
        >
          Volver a Combos
        </Button>
      </div>

      <div className="flex-1 w-full">
        <ComboForm
          key={formKey}
          initialData={null}
          onSubmit={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
          onCancel={() => router.push("/productos/promociones-combo")}
        />
      </div>
    </main>
  );
}
