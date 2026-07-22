"use client";

import { useRouter } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import ProductoForm from "@/components/productos/ProductoForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Producto } from "@/lib/validations/producto.schema";
import { handleError } from "@/lib/auth/errorHandler";
import { useState } from "react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useUserStore } from "@/store/useUserStore";

export default function NuevoProductoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formKey, setFormKey] = useState(0);
  const { puedeCrearArticulo, articulos } = usePlanFeatures();
  const refreshUserData = useUserStore((s) => s.refreshUserData);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Producto>) => {
      const res = await fetch("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw err;
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description:
          "Producto creado correctamente. Puedes cargar el siguiente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["productos-generic"] });
      queryClient.invalidateQueries({ queryKey: ["global-search-products"] });
      refreshUserData();
      setFormKey((prev) => prev + 1);
    },
    onError: (error: any) => {
      handleError(error, "Error al crear producto");
    },
  });

  if (!puedeCrearArticulo) {
    return (
      <main className="min-h-full sm:p-6 space-y-4 flex flex-col">
        <div className="flex items-center">
          <Button
            variant="light"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.push("/productos")}
            className="text-slate-600 px-2 hover:bg-transparent hover:text-slate-900 ml-4 sm:ml-0"
          >
            Volver a productos
          </Button>
        </div>
        <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 py-16">
          <div className="p-4 rounded-full bg-amber-50 border border-amber-100">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>
          <p className="text-slate-600 font-medium text-center max-w-sm">
            {articulos.limite !== null
              ? `Tu plan permite hasta ${articulos.limite} artículos y ya alcanzaste ese límite.`
              : "Tu plan no permite agregar más artículos."}{" "}
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
          onPress={() => router.push("/productos")}
          className="text-slate-600 px-2 hover:bg-transparent hover:text-slate-900 ml-4 sm:ml-0"
        >
          Volver a productos
        </Button>
      </div>

      <div className="flex-1 w-full">
        <ProductoForm
          key={formKey}
          initialData={null}
          onSubmit={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
          onCancel={() => router.push("/productos")}
        />
      </div>
    </main>
  );
}
