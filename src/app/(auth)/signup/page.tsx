"use client";

import Link from "next/link";
import RegistrationForm from "@/components/auth/RegistrationForm";

export default function SignUp() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full space-y-8">
				{/* Header */}
				<div className="text-center">
					<div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
						<svg
							className="h-8 w-8 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/>
						</svg>
					</div>
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Crear Nueva Cuenta
					</h2>
					<p className="text-gray-600">
						Completa la información para registrarte en el sistema
					</p>
				</div>

				{/* Formulario de Registro */}
				<div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
					<RegistrationForm />
				</div>

				{/* Footer */}
				<div className="text-center">
					<p className="text-gray-600">
						¿Ya tienes una cuenta?{" "}
						<Link
							href="/signin"
							className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
						>
							Inicia sesión aquí
						</Link>
					</p>
				</div>

				{/* Additional Info */}
				<div className="text-center text-xs text-gray-500">
					<p>
						Al registrarte, aceptas nuestros términos de servicio y política de
						privacidad
					</p>
				</div>
			</div>
		</div>
	);
}
