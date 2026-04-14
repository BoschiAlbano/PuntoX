"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from "@heroui/react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X } from "lucide-react";

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function CameraScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: CameraScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasCameras, setHasCameras] = useState<boolean | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>("");

  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length && isMounted) {
          setHasCameras(true);
          html5QrCode = new Html5Qrcode("reader");

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 150 },
            },
            (decodedText, decodedResult) => {
              const now = Date.now();
              if (
                lastScannedCodeRef.current === decodedText &&
                now - lastScannedTimeRef.current < 1500
              ) {
                return;
              }
              lastScannedCodeRef.current = decodedText;
              lastScannedTimeRef.current = now;

              onScanSuccessRef.current(decodedText);
            },
            (errorMessage) => {
              // Ignorar errores de frame
            }
          );
        } else if (isMounted) {
          setHasCameras(false);
        }
      } catch (err) {
        console.error("Error iniciando cámara", err);
        if (isMounted) setHasCameras(false);
      }
    };

    const timeout = setTimeout(startScanner, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      
      if (html5QrCode && html5QrCode.isScanning) {
        // Envolver en try/catch y evitar crasheo si ya está transicionando
        try {
          html5QrCode.stop().then(() => {
            html5QrCode?.clear();
          }).catch((err) => {
            console.warn("Error asíncrono al detener cámara:", err);
          });
        } catch (err) {
          console.warn("Fallo síncrono al detener cámara:", err);
        }
      }
    };
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      placement="center"
      backdrop="opaque"
      classNames={{
        base: "bg-white",
        backdrop: "bg-slate-900/60 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-slate-100 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">
                  Escanear Producto
                </span>
              </div>
            </ModalHeader>
            <ModalBody className="p-4 flex flex-col items-center justify-center min-h-[300px]">
              {hasCameras === false ? (
                <div className="text-center text-slate-500 text-sm">
                  No se detectaron cámaras en este dispositivo o permisos
                  denegados.
                </div>
              ) : (
                <div className="w-full relative rounded-xl overflow-hidden shadow-inner border border-slate-200">
                  {/* Contenedor utilizado por Html5Qrcode */}
                  <div
                    id="reader"
                    className="w-full bg-slate-900 mx-auto"
                    style={{ minHeight: "250px" }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-slate-400 mt-2 text-center">
                Apunta la cámara al código de barras. <br />
                Si quieres escanear varias unidades del mismo producto, mantenlo a la vista.
              </p>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
