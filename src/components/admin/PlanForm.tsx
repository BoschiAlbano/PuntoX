"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import { modalMotionProps } from "@/lib/motionConfig";
import type { GenericFormProps } from "@/components/shared/GenericCrud";

type Plan = {
  Id: number;
  Nombre: string;
  Descripcion: string;
  CostoMensual: number;
  Caracteristicas: string;
  CantidadTenants: number;
};

export default function PlanForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<Plan>) {
  const isEdit = !!initialData;

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [costoMensual, setCostoMensual] = useState("");
  const [caracteristicas, setCaracteristicas] = useState("");

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.Nombre);
      setDescripcion(initialData.Descripcion || "");
      setCostoMensual(String(initialData.CostoMensual || ""));
      setCaracteristicas(initialData.Caracteristicas || "");
    } else {
      setNombre("");
      setDescripcion("");
      setCostoMensual("");
      setCaracteristicas("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = () => {
    if (!nombre.trim()) return;

    onSubmit({
      ...(initialData ? { Id: initialData.Id } : {}),
      Nombre: nombre.trim(),
      Descripcion: descripcion.trim(),
      CostoMensual: parseFloat(costoMensual) || 0,
      Caracteristicas: caracteristicas.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="opaque"
      motionProps={modalMotionProps}
      size="lg"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-bold">
            {isEdit ? "Editar Plan" : "Nuevo Plan"}
          </h2>
          <p className="text-sm text-slate-500 font-normal">
            {isEdit
              ? "Modificá los datos del plan SaaS"
              : "Creá un nuevo plan para asignar a tiendas"}
          </p>
        </ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Nombre del plan"
            variant="bordered"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Plan Básico"
            isRequired
            autoFocus
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
          />
          <Textarea
            label="Descripción"
            variant="bordered"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del plan..."
            minRows={2}
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
          />
          <Input
            label="Costo Mensual"
            variant="bordered"
            type="number"
            value={costoMensual}
            onChange={(e) => setCostoMensual(e.target.value)}
            placeholder="0.00"
            startContent={<span className="text-slate-400 text-sm">$</span>}
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
          />
          <Textarea
            label="Características"
            variant="bordered"
            value={caracteristicas}
            onChange={(e) => setCaracteristicas(e.target.value)}
            placeholder="Lista de características incluidas..."
            minRows={3}
            classNames={{ inputWrapper: "bg-white border-slate-200" }}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isSaving}>
            Cancelar
          </Button>
          <Button
            color="primary"
            className="bg-[#0f2233]"
            onPress={handleSubmit}
            isLoading={isSaving}
            isDisabled={!nombre.trim()}
          >
            {isEdit ? "Guardar cambios" : "Crear plan"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
