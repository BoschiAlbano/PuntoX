"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { Shield, ShieldAlert, Smartphone, KeyRound, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { Button, Input, Spinner } from "@heroui/react";
import { useConfiguracion } from "@/hooks/useConfiguracion";

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

  // Estado para el flujo de desactivación que requiere elevar a AAL2
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [isVerifyingDisable, setIsVerifyingDisable] = useState(false);

  const supabase = getSupabaseBrowserClient();

  // Verificar si el 2FA es obligatorio a nivel global
  const { seguridad, isLoadingSeguridad } = useConfiguracion({ enableSeguridad: true });
  const isGloballyEnforced = seguridad?.dobleFactor === true;

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

  /**
   * Inicia el flujo de desactivación del 2FA.
   * Primero verifica el nivel AAL de la sesión.
   * - Si ya es AAL2: hace unenroll directamente.
   * - Si es AAL1: muestra el formulario para ingresar el código TOTP
   *   y elevar la sesión a AAL2 antes de poder hacer unenroll.
   */
  const initDisableMfa = async () => {
    if (!factorId) return;
    if (!window.confirm("¿Estás seguro de que deseas desactivar la autenticación de dos pasos? Tu cuenta será menos segura.")) {
      return;
    }

    try {
      setError(null);
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      if (aalData.currentLevel === "aal2") {
        // La sesión ya está en AAL2, se puede desactivar directamente
        await performUnenroll();
      } else {
        // La sesión está en AAL1 (dispositivo confiable o sesión sin 2FA verificado).
        // Mostramos el formulario para ingresar el código TOTP y elevar a AAL2.
        setShowDisableForm(true);
        setDisableCode("");
      }
    } catch (err) {
      console.error("Error al verificar nivel de sesión:", err);
      setError("No se pudo verificar el estado de la sesión. Intenta de nuevo.");
    }
  };

  /**
   * Verifica el código TOTP para elevar la sesión a AAL2 y luego desactiva el 2FA.
   */
  const handleDisableWithVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || disableCode.length !== 6) return;

    try {
      setIsVerifyingDisable(true);
      setError(null);

      // Elevar la sesión a AAL2
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: disableCode,
      });

      if (verifyError) {
        setError("Código incorrecto o expirado. Intenta de nuevo.");
        return;
      }

      // Ahora que la sesión está en AAL2, hacer unenroll
      await performUnenroll();
    } catch (err) {
      console.error("Error al verificar código para desactivar 2FA:", err);
      setError("Ocurrió un error al verificar el código.");
    } finally {
      setIsVerifyingDisable(false);
    }
  };

  /**
   * Realiza el unenroll efectivo. Requiere que la sesión ya esté en AAL2.
   * Después de desactivar el 2FA, revoca todos los dispositivos confiables
   * del usuario para evitar que tokens anteriores queden activos y se acumulen
   * registros al reactivar el 2FA en el futuro.
   */
  const performUnenroll = async () => {
    if (!factorId) return;
    try {
      setIsUnenrolling(true);
      setError(null);

      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      // Revocar todos los dispositivos confiables del usuario y borrar la cookie.
      // No es bloqueante: si falla, el unenroll ya ocurrió correctamente.
      fetch("/api/auth/trusted-device", { method: "DELETE" }).catch((e) =>
        console.warn("[MfaSetup] Error al revocar dispositivos confiables:", e),
      );

      setIsEnrolled(false);
      setFactorId(null);
      setShowDisableForm(false);
      setDisableCode("");
    } catch (err) {
      console.error("Error al desactivar 2FA:", err);
      setError("Ocurrió un error al intentar desactivar el 2FA.");
    } finally {
      setIsUnenrolling(false);
    }
  };

  if (loading && !setupData || isLoadingSeguridad && !setupData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  // Formulario de verificación para elevar a AAL2 antes de desactivar
  if (showDisableForm) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-500">
            <Lock size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Confirmar identidad</h2>
            <p className="text-sm text-slate-500">Ingresá tu código 2FA para desactivarlo</p>
          </div>
        </div>

        <form onSubmit={handleDisableWithVerification} className="space-y-5">
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
            <p className="text-sm text-amber-800">
              Por seguridad, necesitás verificar tu identidad con el código de tu aplicación autenticadora antes de poder desactivar el 2FA.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="max-w-xs mx-auto">
            <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
              Código de verificación
            </label>
            <Input
              type="text"
              value={disableCode}
              onChange={(e) => {
                setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError(null);
              }}
              placeholder="000000"
              className="font-mono text-center text-lg tracking-[0.2em]"
              size="lg"
              isDisabled={isVerifyingDisable}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="flat"
              onPress={() => {
                setShowDisableForm(false);
                setDisableCode("");
                setError(null);
              }}
              isDisabled={isVerifyingDisable}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              variant="flat"
              type="submit"
              isLoading={isVerifyingDisable || isUnenrolling}
              isDisabled={disableCode.length !== 6}
              className="font-medium"
            >
              Verificar y desactivar 2FA
            </Button>
          </div>
        </form>
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

      {/* Aviso de 2FA obligatorio por política del tenant */}
      {isGloballyEnforced && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
          <Shield size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">
            La autenticación de dos pasos es <strong>obligatoria</strong> en esta organización. No es posible desactivarla.
          </p>
        </div>
      )}

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
          {/* Solo se muestra el botón de desactivar si el 2FA NO es obligatorio globalmente */}
          {!isGloballyEnforced && (
            <Button
              color="danger"
              variant="flat"
              onPress={initDisableMfa}
              isLoading={isUnenrolling}
              className="font-medium"
            >
              Desactivar 2FA
            </Button>
          )}
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
              {isGloballyEnforced
                ? "La autenticación de dos pasos (2FA) es obligatoria en tu organización. Debés activarla para poder acceder al sistema."
                : "La autenticación de dos pasos (2FA) no está activada en tu cuenta. Es muy recomendable activarla para proteger tu información."}
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
