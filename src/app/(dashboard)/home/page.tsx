"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
	const { data: session } = useSession();
	const router = useRouter();

	return (
		<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			{/* Header */}
			<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					¡Bienvenido a Punto X SaaS!
				</h1>
				<p className="text-gray-600">
					Panel de control principal de tu aplicación
				</p>
			</div>

			{/* Información del Usuario */}
			<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">
					Información de la Sesión
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Nombre
						</label>
						<p className="text-gray-900">
							{session?.user?.name || "No disponible"}
						</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Email
						</label>
						<p className="text-gray-900">
							{session?.user?.email || "No disponible"}
						</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Rol
						</label>
						<p className="text-gray-900">
							{session?.user?.roll || "No definido"}
						</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Estado de Sesión
						</label>
						<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
							Autenticado
						</span>
					</div>
				</div>
			</div>

			{/* Acciones Rápidas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white rounded-lg shadow-sm p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						Panel de Control
					</h3>
					<p className="text-gray-600 mb-4">
						Accede a las funciones principales del sistema
					</p>
					<button
						onClick={() => router.push("/panel")}
						className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Ir al Panel
					</button>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-2">Perfil</h3>
					<p className="text-gray-600 mb-4">Gestiona tu información personal</p>
					<button
						onClick={() => router.push("/perfil")}
						className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
					>
						Ver Perfil
					</button>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						Configuración
					</h3>
					<p className="text-gray-600 mb-4">Ajusta parámetros del sistema</p>
					<button
						onClick={() => router.push("/configuracion")}
						className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
					>
						Configurar
					</button>
				</div>
			</div>

			{/* Debug Info (solo en desarrollo) */}
			{process.env.NODE_ENV === "development" && (
				<div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-sm font-medium text-yellow-800 mb-2">
						🔍 Información de Debug (Solo Desarrollo)
					</h3>
					<pre className="text-xs text-yellow-700 overflow-auto">
						{JSON.stringify(session, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}
