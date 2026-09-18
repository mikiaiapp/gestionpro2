"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        setLoading(true);

        // Timeout de seguridad de 3 segundos para evitar bloqueos infinitos de la app
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 3000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

        if (!mounted) return;

        const isPublicPath = pathname === "/login" || pathname === "/signup" || pathname === "/";

        if (!session && !isPublicPath) {
          setAuthorized(false);
          router.replace("/login");
        } else if (session && isPublicPath && pathname !== "/") {
          setAuthorized(true);
          router.replace("/resumen");
        } else {
          setAuthorized(true);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        if (mounted) {
          setAuthorized(false);
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Escuchar cambios de estado de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setAuthorized(false);
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const isPublicPath = pathname === "/login" || pathname === "/signup" || pathname === "/";

  // Si está cargando y no es ruta pública, mostramos spinner con opción de desbloqueo manual por si falla la red
  if (loading && !isPublicPath) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white flex-col gap-4 p-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Iniciando Seguridad...</p>
        <button
          onClick={() => {
            setLoading(false);
            router.replace("/login");
          }}
          className="mt-4 text-xs font-bold text-blue-600 hover:underline"
        >
          Si no carga, haz clic aquí para ir al inicio de sesión
        </button>
      </div>
    );
  }

  if (!authorized && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
