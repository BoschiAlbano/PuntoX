"use client";

import { useRouter } from "next/navigation";
import { Button, addToast } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import FormularioProveedor from "@/components/proveedores/FormularioProveedor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Proveedor } from "@/lib/validations/proveedor.schema";
import { handleError } from "@/lib/auth/errorHandler";
import { useState } from "react";

export default function NuevoProveedorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formKey, setFormKey] = useState(0);

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Proveedor>) => {
      const res = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || err?.message || "Error al crear proveedor");
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Proveedor creado correctamente. Puedes cargar el siguiente.",
        color: "success",
        timeout: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["proveedores-generic"] });
      setFormKey((prev) => prev + 1);
    },
    onError: (error: any) => {
      handleError(error, "Error al crear proveedor");
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

      <div className="flex-1 w-full">
        <FormularioProveedor
          key={formKey}
          initialData={null}
          onSubmit={(data) => createMutation.mutate(data)}
          isSaving={createMutation.isPending}
          onCancel={() => router.push("/proveedores")}
        />
      </div>
    </main>
  );
}
