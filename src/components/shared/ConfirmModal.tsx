"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { modalMotionProps } from "@/lib/motionConfig";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "primary" | "success";
  size?: "sm" | "md" | "lg";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isLoading = false,
  variant = "primary",
}: ConfirmModalProps) {
  const isDanger = variant === "danger";
  const Icon = isDanger ? Trash2 : AlertTriangle;

  const iconBg = isDanger ? "bg-rose-100" : "bg-[#67afc3]/10";
  const iconColor = isDanger ? "text-rose-600" : "text-[#67afc3]";
  const confirmBtnClass = isDanger
    ? "bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md shadow-rose-500/30 h-10 px-6"
    : "bg-[#67afc3] hover:bg-[#4899b0] text-white font-bold rounded-xl shadow-md shadow-[#67afc3]/30 h-10 px-6";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton
      isDismissable={!isLoading}
      motionProps={modalMotionProps}
      classNames={{
        backdrop: "bg-slate-900/60 backdrop-blur-sm",
        wrapper: "items-end sm:items-center",
        base: "font-sans bg-white shadow-2xl border-0 sm:border border-slate-200 rounded-none sm:rounded-2xl w-full sm:max-w-[420px] m-0 sm:m-auto",
      }}
    >
      <ModalContent>
        {/* ── Header ── */}
        <ModalHeader className="flex items-center gap-3 py-4 px-5 border-b border-slate-100">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={17} className={iconColor} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-base font-bold text-slate-800 leading-tight">
              {title}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              {isDanger ? "Esta acción no se puede deshacer" : "Confirmá la acción"}
            </span>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl shrink-0"
          >
            <X size={16} />
          </Button>
        </ModalHeader>

        {/* ── Body ── */}
        {description != null && (
          <ModalBody className="px-5 py-5">
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isDanger
                  ? "bg-rose-50 border-rose-100 text-rose-700"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              {typeof description === "string" ? (
                <p>{description}</p>
              ) : (
                description
              )}
            </div>
          </ModalBody>
        )}

        {/* ── Footer ── */}
        <ModalFooter className="flex items-center justify-between py-3.5 px-5 border-t border-slate-100 bg-white gap-3">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
            className="font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl h-10 px-5"
          >
            {cancelLabel}
          </Button>
          <Button
            onPress={onConfirm}
            isLoading={isLoading}
            className={confirmBtnClass}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
