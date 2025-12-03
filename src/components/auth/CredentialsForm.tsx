"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function CredentialsForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const { login } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		console.log("Entra");

		e.preventDefault();
		setError("");

		try {
			const data = await login("credentials", { email, password });
		} catch (error) {
			setError("Credenciales inválidas");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label
					htmlFor="email"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Correo electrónico
				</label>
				<input
					id="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="tu@email.com"
				/>
			</div>

			<div>
				<label
					htmlFor="password"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Contraseña
				</label>
				<input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					placeholder="••••••••"
				/>
			</div>

			{error && (
				<div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
					{error}
				</div>
			)}

			<button
				type="submit"
				className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 font-medium"
			>
				Iniciar sesión
			</button>
		</form>
	);
}
