"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { Shield, ShieldAlert, Smartphone, KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, Input, Spinner } from "@heroui/react";

export function MfaSetup() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  // Setup state
  const [setupData, setSetupData] = useState<{
    qrCode: string;
    secret: string;
    uri: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactor = data.totp[0];
      if (totpFactor && totpFactor.status === "verified") {
        setIsEnrolled(true);
        setFactorId(totpFactor.id);
      } else {
        setIsEnrolled(false);
        setFactorId(null);
      }
    } catch (err) {
      console.error("Error al obtener estado MFA:", err);
      setError("No se pudo cargar el estado de seguridad.");
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Limpiar cualquier factor "unverified" previo que haya quedado colgado
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      if (factorsData?.totp) {
        for (const factor of factorsData.totp) {
          if ((factor as any).status === "unverified") {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }

      // 2. Iniciar el nuevo enrolamiento
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Dispositivo ${new Date().getTime()}`
      });

      if (error) throw error;

      setFactorId(data.id);
      setSetupData({
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
    } catch (err) {
      console.error("Error al iniciar 2FA:", err);
      setError("Ocurrió un error al iniciar la configuración del 2FA.");
    } finally {
      setLoading(false);
    }
  };

  const verifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || !verifyCode || verifyCode.length !== 6) return;

    try {
      setIsVerifying(true);
      setError(null);

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      // Éxito
      setIsEnrolled(true);
      setSetupData(null);
      setVerifyCode("");
    } catch (err) {
      console.error("Error al verificar 2FA:", err);
      setError("El código es incorrecto o ha expirado. Intenta de nuevo.");
    } finally {
      setIsVerifying(false);
    }
  };

  const disableMfa = async () => {
    if (!factorId) return;
    if (!window.confirm("¿Estás seguro de que deseas desactivar la autenticación de dos pasos? Tu cuenta será menos segura.")) {
      return;
    }

    try {
      setIsUnenrolling(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;

      setIsEnrolled(false);
      setFactorId(null);
    } catch (err) {
      console.error("Error al desactivar 2FA:", err);
      setError("Ocurrió un error al intentar desactivar el 2FA.");
    } finally {
      setIsUnenrolling(false);
    }
  };

  if (loading && !setupData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className={`p-2 rounded-xl ${isEnrolled ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
          <Shield size={24} strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Autenticación de Dos Pasos (2FA)</h2>
          <p className="text-sm text-slate-500">Agrega una capa adicional de seguridad a tu cuenta</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {isEnrolled ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <p className="text-sm text-emerald-800 font-medium">
              La autenticación de dos pasos está activada.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Se te pedirá un código de verificación de tu aplicación autenticadora cada vez que inicies sesión.
          </p>
          <Button
            color="danger"
            variant="flat"
            onPress={disableMfa}
            isLoading={isUnenrolling}
            className="font-medium"
          >
            Desactivar 2FA
          </Button>
        </div>
      ) : setupData ? (
        <form onSubmit={verifyEnrollment} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Smartphone size={18} className="text-[#67afc3]" />
              Paso 1: Escanea el código QR
            </h3>
            <p className="text-sm text-slate-600">
              Abre tu aplicación autenticadora (como Google Authenticator o Authy) y escanea este código.
            </p>
            <div className="flex justify-center p-4 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <QRCodeSVG value={setupData.uri} size={200} />
            </div>
            <p className="text-xs text-center text-slate-500 mt-2 break-all">
              O ingresa este código manualmente: <strong className="font-mono bg-slate-100 px-2 py-1 rounded">{setupData.secret}</strong>
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <KeyRound size={18} className="text-[#67afc3]" />
              Paso 2: Verifica el código
            </h3>
            <p className="text-sm text-slate-600">
              Ingresa el código de 6 dígitos que muestra tu aplicación para confirmar la configuración.
            </p>
            <div className="max-w-xs mx-auto">
              <Input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="font-mono text-center text-lg tracking-[0.2em]"
                size="lg"
                isDisabled={isVerifying}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="flat"
              onPress={() => {
                setSetupData(null);
                setVerifyCode("");
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              className="bg-[#67afc3] text-white font-medium"
              type="submit"
              isLoading={isVerifying}
              isDisabled={verifyCode.length !== 6}
            >
              Verificar y activar
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <ShieldAlert size={20} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              La autenticación de dos pasos (2FA) no está activada en tu cuenta. Es muy recomendable activarla para proteger tu información.
            </p>
          </div>
          <Button
            color="primary"
            className="bg-[#67afc3] text-white font-medium"
            onPress={startEnrollment}
          >
            Activar Autenticación 2FA
          </Button>
        </div>
      )}
    </div>
  );
}
