"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";

interface SeguridadConfig {
  bloquearPorInactividad: boolean;
  tiempoInactividadMinutos: number;
}

const CONFIG_CACHE_KEY = "inactivity_timeout_config";

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
  const isTabVisibleRef = useRef<boolean>(true);

  // Cargar configuración de seguridad (con cache en sessionStorage)
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadSeguridad = async () => {
      // Intentar cargar desde cache primero (solo para render inicial más rápido)
      try {
        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem(CONFIG_CACHE_KEY);
          if (cached) {
            const cachedData = JSON.parse(cached) as SeguridadConfig;
            setSeguridad(cachedData);
          }
        }
      } catch (error) {
        // Ignorar errores de cache
      }

      // Cargar desde API (siempre para tener datos frescos)
      try {
        const response = await fetch("/api/configuracion/seguridad", {
          credentials: "include",
          cache: "no-store",
          signal: abortController.signal,
        });
        if (response.ok) {
          const data = await response.json();
          const config: SeguridadConfig = {
            bloquearPorInactividad: data.bloquearPorInactividad ?? false,
            tiempoInactividadMinutos: data.tiempoInactividadMinutos ?? 30,
          };
          setSeguridad(config);
          
          // Guardar en cache
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
            } catch (error) {
              // Ignorar errores de sessionStorage (puede estar lleno o deshabilitado)
            }
          }
        }
      } catch (error) {
        // Ignorar errores de abort (componente desmontado)
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.warn("[Inactividad] Error al cargar configuración de seguridad:", error);
      }
    };

    loadSeguridad();

    // Cleanup: cancelar fetch si el componente se desmonta
    return () => {
      abortController.abort();
    };
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

    // Si la pestaña no está visible, no iniciar timeout (se iniciará cuando vuelva a ser visible)
    if (!isTabVisibleRef.current) {
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

    // Nota: lastActivityRef se actualiza en handleActivity para evitar duplicación
  }, [seguridad, supabase, status]);

  // Función para registrar actividad (optimizada con throttling)
  const handleActivity = useCallback(() => {
    const now = Date.now();
    // Throttling de 1 segundo: solo procesa si pasó 1 segundo desde la última actividad
    // Esto evita procesar eventos redundantes y mejora el rendimiento
    if (now - lastActivityRef.current > 1000) {
      // Actualizar ref antes de llamar resetTimeout para evitar procesamiento duplicado
      lastActivityRef.current = now;
      resetTimeout();
    }
  }, [resetTimeout]);

  // Manejar visibilidad de la pestaña (Page Visibility API)
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isTabVisibleRef.current = isVisible;

      if (!isVisible) {
        // Pestaña oculta: pausar timeout (el tiempo que la pestaña está oculta no cuenta como inactividad)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else {
        // Pestaña visible: reiniciar timeout desde cero cuando el usuario vuelve
        // Esto es más justo porque el tiempo fuera de la pestaña no debería contar como inactividad
        if (status === "authenticated" && seguridad?.bloquearPorInactividad) {
          resetTimeout();
        }
      }
    };

    // Actualizar estado inicial
    isTabVisibleRef.current = !document.hidden;

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, seguridad, resetTimeout]);

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
    // Nota: Los listeners siempre se agregan (también funcionan cuando la pestaña vuelve a ser visible)
    // El timeout se controla dinámicamente según la visibilidad en resetTimeout()
    // Optimizado: removidos eventos redundantes y muy frecuentes
    // - mousemove: se dispara cientos de veces/segundo (innecesario)
    // - click: redundante con mousedown (click siempre incluye mousedown)
    // - keypress: deprecado y redundante con keydown
    const events = [
      "mousedown",    // Detecta clicks del mouse
      "keydown",      // Detecta pulsaciones de teclado
      "scroll",       // Detecta scroll
      "touchstart",   // Detecta toques en móviles
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

