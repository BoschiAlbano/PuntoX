"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Panel() {
	const { data: session } = useSession();
	const router = useRouter();

	return (
		<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			{/* Header del Panel */}
			<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Panel de Control
						</h1>
						<p className="text-gray-600">
							Bienvenido, {session?.user?.name || "Usuario"}
						</p>
					</div>
					<button
						onClick={() => router.push("/home")}
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
					>
						← Volver al Home
					</button>
				</div>
			</div>

			{/* Información del Usuario */}
			<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">
					Detalles de la Sesión
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="text-center p-4 bg-blue-50 rounded-lg">
						<div className="text-2xl font-bold text-blue-600 mb-2">
							{session?.user?.name || "N/A"}
						</div>
						<div className="text-sm text-blue-500">Nombre</div>
					</div>
					<div className="text-center p-4 bg-green-50 rounded-lg">
						<div className="text-2xl font-bold text-green-600 mb-2">
							{session?.user?.email || "N/A"}
						</div>
						<div className="text-sm text-green-500">Email</div>
					</div>
					<div className="text-center p-4 bg-purple-50 rounded-lg">
						<div className="text-2xl font-bold text-purple-600 mb-2">
							{session?.user?.roll || "N/A"}
						</div>
						<div className="text-sm text-purple-500">Rol</div>
					</div>
				</div>
			</div>

			{/* Funcionalidades del Panel */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
					<div className="text-blue-600 text-3xl mb-4">👥</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						Gestión de Usuarios
					</h3>
					<p className="text-gray-600 mb-4">Administra usuarios del sistema</p>
					<button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
						Acceder
					</button>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
					<div className="text-green-600 text-3xl mb-4">📊</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Reportes</h3>
					<p className="text-gray-600 mb-4">Genera y visualiza reportes</p>
					<button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
						Acceder
					</button>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
					<div className="text-purple-600 text-3xl mb-4">⚙️</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						Configuración
					</h3>
					<p className="text-gray-600 mb-4">Ajusta parámetros del sistema</p>
					<button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
						Acceder
					</button>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
					<div className="text-orange-600 text-3xl mb-4">🔒</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Seguridad</h3>
					<p className="text-gray-600 mb-4">Configuración de seguridad</p>
					<button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
						Acceder
					</button>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
					<div className="text-red-600 text-3xl mb-4">📝</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Logs</h3>
					<p className="text-gray-600 mb-4">Revisa logs del sistema</p>
					<button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
						Acceder
					</button>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
					<div className="text-indigo-600 text-3xl mb-4">🔄</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Backup</h3>
					<p className="text-gray-600 mb-4">Gestión de respaldos</p>
					<button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
						Acceder
					</button>
				</div>
			</div>

			{/* Información de Debug */}
			{process.env.NODE_ENV === "development" && (
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<h3 className="text-sm font-medium text-yellow-800 mb-2">
						🔍 Debug: Información de Sesión (Solo Desarrollo)
					</h3>
					<pre className="text-xs text-yellow-700 overflow-auto">
						{JSON.stringify(session, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}
