"use client";

import { useState } from "react";
import { Button, Switch, Input } from "@heroui/react";
import { ShieldCheck, Upload, Trash2, Server, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { VentasSection } from "./ventas/VentasPrimitives";

export function ArcaSettings() {
  const { fiscal, saveFiscal, isSavingFiscal, refetchFiscal } = useConfiguracion({ enableFiscal: true });
  const { tieneAFIP } = usePlanFeatures();

  const [certFile, setCertFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ok: boolean, message: string} | null>(null);

  if (!fiscal) return null;

  const handleUpload = async () => {
    if (!certFile || !keyFile) return;
    
    setIsUploading(true);
    try {
      const certText = await certFile.text();
      const keyText = await keyFile.text();
      
      const res = await fetch('/api/configuracion/fiscal/certificados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificado: certText,
          clavePrivada: keyText
        })
      });
      
      if (res.ok) {
        setCertFile(null);
        setKeyFile(null);
        refetchFiscal();
      } else {
        const error = await res.json();
        alert(`Error al subir certificados: ${error.details?.[0]?.message || error.error}`);
      }
    } catch (e) {
      alert("Error al procesar los archivos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Está seguro de eliminar los certificados? Esto deshabilitará la facturación electrónica.")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/configuracion/fiscal/certificados', { method: 'DELETE' });
      if (res.ok) {
        refetchFiscal();
        setVerificationResult(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/configuracion/fiscal/arca/verificar');
      const data = await res.json();
      setVerificationResult({
        ok: data.ok,
        message: data.ok ? "Conexión exitosa. ARCA está respondiendo correctamente." : (data.error || "Error de conexión")
      });
    } catch (e) {
      setVerificationResult({ ok: false, message: "Error al intentar conectar" });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <VentasSection title="Facturación Electrónica (ARCA)" icon={ShieldCheck}>
      <div className="space-y-6 px-1">

        {!tieneAFIP && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Tu plan actual no incluye Facturación Electrónica. Actualizá tu
              plan para poder habilitarla y emitir comprobantes AFIP.
            </p>
          </div>
        )}

        {/* Switches */}
        <div className="flex flex-col sm:flex-row gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <Switch
            isSelected={fiscal.afipHabilitado}
            onValueChange={(val) => saveFiscal({ ...fiscal, afipHabilitado: val })}
            isDisabled={!fiscal.afipCertificadoCargado || isSavingFiscal || !tieneAFIP}
            color="success"
            size="sm"
          >
            <div className="flex flex-col ml-1">
              <span className="font-semibold text-slate-700 text-sm">Habilitar Facturación</span>
              <span className="text-xs text-slate-500">
                {!tieneAFIP
                  ? "No incluida en tu plan actual"
                  : fiscal.afipCertificadoCargado
                    ? "Activa la autorización de comprobantes"
                    : "Requiere cargar certificados primero"}
              </span>
            </div>
          </Switch>
          
          <Switch
            isSelected={fiscal.afipEntornoProduccion}
            onValueChange={(val) => saveFiscal({ ...fiscal, afipEntornoProduccion: val })}
            isDisabled={isSavingFiscal}
            color="warning"
            size="sm"
          >
            <div className="flex flex-col ml-1">
              <span className="font-semibold text-slate-700 text-sm">Entorno de Producción</span>
              <span className="text-xs text-slate-500">Si está apagado, opera en Homologación (testing)</span>
            </div>
          </Switch>
        </div>

        {/* Certificados */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Certificados Digitales
            {fiscal.afipCertificadoCargado ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Instalado</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">Faltante</span>
            )}
          </h4>
          
          {!fiscal.afipCertificadoCargado ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Certificado (.crt)</label>
                <input 
                  type="file" 
                  accept=".crt,.pem" 
                  onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#67afc3]/10 file:text-[#67afc3] hover:file:bg-[#67afc3]/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Clave Privada (.key)</label>
                <input 
                  type="file" 
                  accept=".key,.pem" 
                  onChange={(e) => setKeyFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#67afc3]/10 file:text-[#67afc3] hover:file:bg-[#67afc3]/20"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button 
                  size="sm" 
                  color="primary" 
                  className="bg-[#67afc3]" 
                  startContent={<Upload size={14} />}
                  isDisabled={!certFile || !keyFile}
                  isLoading={isUploading}
                  onPress={handleUpload}
                >
                  Subir Certificados
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex-1">
                <p className="text-sm text-slate-600 font-medium">Los certificados están instalados de forma segura.</p>
                {fiscal.afipCertificadoVence && (
                  <p className="text-xs text-slate-400 mt-1">Vencimiento: {fiscal.afipCertificadoVence}</p>
                )}
              </div>
              <Button 
                size="sm" 
                color="danger" 
                variant="flat" 
                startContent={<Trash2 size={14} />}
                isLoading={isDeleting}
                onPress={handleDelete}
              >
                Eliminar
              </Button>
            </div>
          )}
        </div>

        {/* Verificación */}
        {fiscal.afipCertificadoCargado && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <Button 
                size="sm" 
                variant="bordered"
                startContent={<Server size={14} />}
                isLoading={isVerifying}
                onPress={handleVerify}
              >
                Probar Conexión ARCA
              </Button>
              {verificationResult && (
                <span className={`text-sm flex items-center gap-1.5 font-medium ${verificationResult.ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {verificationResult.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {verificationResult.message}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </VentasSection>
  );
}
