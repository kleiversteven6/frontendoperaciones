import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { adminStats } from "../context/globalvars";
import { Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

// Registra los componentes de ChartJS
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
    const [stats, setStats] = useState({
        Preparacion: [],
        Chequeo: [],
        Embalaje: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(adminStats, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Error fetching stats");

            const data = await res.json();
            console.log(data);
            
            setStats(data);
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar las estadísticas.",
            });
        } finally {
            setLoading(false);
        }
    };

    // Datos para la gráfica de resumen
    const summaryChartData = {
        labels: ["Preparación", "Chequeo", "Embalaje"],
        datasets: [
            {
                label: "Total por área",
                data: [
                    stats.Preparacion.reduce((sum, item) => sum + item.count, 0),
                    stats.Chequeo.reduce((sum, item) => sum + item.count, 0),
                    stats.Embalaje.reduce((sum, item) => sum + item.count, 0),
                ],
                backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6"],
                borderRadius: 5,
            },
        ],
    };

    // Función para generar datos de gráfica por persona
    const getChartDataForStatus = (statusData) => {
        return {
            labels: statusData.map((item) => item.username),
            datasets: [
                {
                    label: "Productividad",
                    data: statusData.map((item) => item.count),
                    backgroundColor: statusData.map((_, index) =>
                        index === 0 ? "#fbbf24" : index === 1 ? "#9ca3af" : index === 2 ? "#f97316" : "#6b7280"
                    ),
                    borderRadius: 5,
                },
            ],
        };
    };

    const LeaderboardCard = ({ title, data, colorClass, icon }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-white rounded-xl shadow-lg border-t-4 ${colorClass} p-6 flex flex-col h-full`}
        >
            <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{icon}</span>
                <h3 className="text-xl font-bold text-gray-700">{title}</h3>
            </div>
            {data.length === 0 ? (
                <p className="text-gray-400 italic text-center py-4">Sin datos aún</p>
            ) : (
                <>
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-48 mb-4">
                        {data.map((item, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                className="flex justify-between items-center p-2 rounded hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`
                                            w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                                            ${
                                                index === 0
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : index === 1
                                                    ? "bg-gray-100 text-gray-700"
                                                    : index === 2
                                                    ? "bg-orange-100 text-orange-700"
                                                    : "text-gray-500"
                                            }
                                        `}
                                    >
                                        {index + 1}
                                    </span>
                                    <span className="font-semibold text-gray-700">{item.username}</span>
                                </div>
                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">
                                    {item.count}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-4 h-48">
                        <Bar
                            data={getChartDataForStatus(data)}
                            options={{
                                indexAxis: "y", // Gráfica horizontal
                                responsive: true,
                                plugins: {
                                    legend: { display: false },
                                    title: { display: false },
                                },
                                scales: {
                                    x: { beginAtZero: true },
                                },
                            }}
                        />
                    </div>
                </>
            )}
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Tablero de Productividad</h1>
                    <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold">
                        &larr; Volver al Inicio
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Gráfica de resumen */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-xl shadow-lg p-6 mb-6"
                        >
                            <h2 className="text-xl font-bold mb-4 text-gray-700">Resumen de Productividad</h2>
                            <div className="h-64">
                                <Bar
                                    data={summaryChartData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { position: "top" },
                                            title: { display: false },
                                        },
                                    }}
                                />
                            </div>
                        </motion.div>

                        {/* Tarjetas de líder con gráficas por persona */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <LeaderboardCard
                                title="Preparación"
                                data={stats.Preparacion}
                                colorClass="border-blue-500"
                                icon="📦"
                            />
                            <LeaderboardCard
                                title="Chequeo"
                                data={stats.Chequeo}
                                colorClass="border-green-500"
                                icon="✅"
                            />
                            <LeaderboardCard
                                title="Embalaje"
                                data={stats.Embalaje}
                                colorClass="border-purple-500"
                                icon="🏷️"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
