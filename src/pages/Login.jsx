import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/api";

// Componente de Logo simple (Cruz médica)
const MedicalLogo = () => (
    <svg className="w-16 h-16 mx-auto text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
    </svg>
);

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [hiddenInput, setHiddenInput] = useState(true);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = await login(username, password);        
        setError("");
        try {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
             window.location.href = "/";
        } catch (err) {
            setError("Credenciales inválidas o error de conexión");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border-t-4 border-teal-500">
                <div className="text-center">
                    <MedicalLogo />
                    <h2 className="mt-4 text-3xl font-bold text-gray-800">
                        Operaciones
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">Sistema de Gestión de Operaciones</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r" role="alert">
                        <p className="font-bold">Error de Acceso</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Usuario
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="Ingresa tu usuario"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Contraseña
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </span>
                            <input
                                type={hiddenInput ? 'password' : 'text'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required

                            />
                            <span className="absolute inset-y-0 right-4 flex items-center pl-3 text-gray-400"
                                onClick={() => setHiddenInput(!hiddenInput)}
                                style={{ cursor: 'pointer' }}>
                                {hiddenInput ?
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                    :
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                }

                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-5 py-3 text-sm font-bold text-white uppercase tracking-wide bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-teal-300 shadow-lg transform active:scale-95 transition-all"
                    >
                        Ingresar al Sistema
                    </button>
                </form>

                
            </div>
        </div>
    );
}
