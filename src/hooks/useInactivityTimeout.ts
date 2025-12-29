"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

interface SeguridadConfig {
  bloquearPorInactividad: boolean;
  tiempoInactividadMinutos: number;
}

/**
 * Hook para monitorear la inactividad del usuario y cerrar la sesión automáticamente
 * cuando se alcanza el tiempo configurado
 */
export function useInactivityTimeout() {
  const { supabase, status } = useSupabaseAuthContext();
  const [seguridad, setSeguridad] = useState<SeguridadConfig | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isClosingRef = useRef<boolean>(false);

  // Cargar configuración de seguridad
  useEffect(() => {
    const loadSeguridad = async () => {
      try {
        const response = await fetch("/api/configuracion/seguridad", {
          credentials: "include",
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setSeguridad({
            bloquearPorInactividad: data.bloquearPorInactividad ?? false,
            tiempoInactividadMinutos: data.tiempoInactividadMinutos ?? 30,
          });
        }
      } catch (error) {
        console.warn("[Inactividad] Error al cargar configuración de seguridad:", error);
      }
    };

    loadSeguridad();
  }, []);

  // Función para resetear el timeout
  const resetTimeout = useCallback(() => {
    // Si ya se está cerrando la sesión, no hacer nada
    if (isClosingRef.current) {
      return;
    }

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Si el bloqueo por inactividad está desactivado, no hacer nada
    if (!seguridad?.bloquearPorInactividad || !seguridad?.tiempoInactividadMinutos) {
      return;
    }

    // Si no hay sesión activa, no hacer nada
    if (status !== "authenticated") {
      return;
    }

    const timeoutMs = seguridad.tiempoInactividadMinutos * 60 * 1000; // Convertir minutos a milisegundos

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(async () => {
      // Evitar múltiples ejecuciones
      if (isClosingRef.current) {
        return;
      }
      isClosingRef.current = true;

      console.log(`[Inactividad] Sesión cerrada por inactividad después de ${seguridad.tiempoInactividadMinutos} minutos`);
      
      // Limpiar el timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Cerrar sesión en la base de datos primero
      try {
        await fetch("/api/auth/registrar-sesion", {
          method: "DELETE",
          credentials: "include",
        });
      } catch (error) {
        console.warn("[Inactividad] Error al cerrar sesión en BD:", error);
      }

      // Cerrar sesión en Supabase
      try {
        await supabase.auth.signOut();
        // Esperar un momento para que se complete el cierre de sesión
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn("[Inactividad] Error al cerrar sesión en Supabase:", error);
      }
      
      // Redirigir al login usando window.location para forzar recarga completa
      window.location.href = "/signin";
    }, timeoutMs);

    lastActivityRef.current = Date.now();
  }, [seguridad, supabase, status]);

  // Función para registrar actividad
  const handleActivity = useCallback(() => {
    const now = Date.now();
    // Solo resetear si han pasado al menos 1 segundo desde la última actividad
    // Esto evita resetear demasiado frecuentemente
    if (now - lastActivityRef.current > 1000) {
      resetTimeout();
    }
  }, [resetTimeout]);

  useEffect(() => {
    // Si no hay sesión autenticada, no hacer nada
    if (status !== "authenticated") {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Si el bloqueo por inactividad está desactivado, no hacer nada
    if (!seguridad?.bloquearPorInactividad || !seguridad?.tiempoInactividadMinutos) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Eventos que indican actividad del usuario
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    // Agregar listeners de eventos
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar el timeout inicial
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [seguridad, handleActivity, resetTimeout, status]);
}

