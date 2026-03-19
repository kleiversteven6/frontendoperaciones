import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/api";

// Componente de Logo simple (Cruz médica)
const MedicalLogo = () => (
    <svg className="w-16 h-16 mx-auto text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
    </svg>
);

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        try {
            await register(username, password, role);
            setSuccess("Usuario registrado exitosamente. Redirigiendo...");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Error al registrar usuario");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border-t-4 border-teal-500">
                <div className="text-center">
                    <MedicalLogo />
                    <h2 className="mt-4 text-3xl font-bold text-gray-800">
                        Registro <span className="text-teal-600">Personal</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">Alta de nuevo operador</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {success && (
                    <div className="p-4 text-sm text-green-700 bg-green-50 border-l-4 border-green-500 rounded-r" role="alert">
                        <p className="font-bold">Éxito</p>
                        <p>{success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Usuario
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="Ej. operador1"
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
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-semibold text-gray-700">
                            Rol
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            </span>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all appearance-none"
                            >
                                <option value="user">Usuario Operativo</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full px-5 py-3 text-sm font-bold text-white uppercase tracking-wide bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-teal-300 shadow-lg transform active:scale-95 transition-all"
                    >
                        Registrar Usuario
                    </button>
                </form>

                <div className="text-center text-sm text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 hover:underline">
                        Volver al Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
