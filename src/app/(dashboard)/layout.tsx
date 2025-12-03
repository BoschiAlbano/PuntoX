"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/signin");
		}
	}, [status, router]);

	// Mostrar loading mientras se verifica la autenticación
	if (status === "loading") {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Verificando autenticación...</p>
				</div>
			</div>
		);
	}

	// Si no está autenticado, no mostrar nada (se redirigirá)
	if (status === "unauthenticated") {
		return null;
	}

	// Si está autenticado, mostrar el contenido del dashboard
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header del Dashboard */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold text-gray-900">
								Punto X SaaS
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600">
								Hola, {session?.user?.name || "Usuario"}
							</span>
							<button
								onClick={() => router.push("/api/auth/signout")}
								className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
							>
								Cerrar Sesión
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Contenido principal */}
			<main>{children}</main>
		</div>
	);
}
