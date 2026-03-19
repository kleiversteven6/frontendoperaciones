import { useState } from "react";
import Swal from "sweetalert2";
import Input from "../components/Input";

import { processLog, processLogs } from "../context/globalvars";
import { Form, Button, Container } from "semantic-ui-react";

export default function Admin() {
    const [codigo, setCodigo] = useState("");
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const buscarLogs = async () => {
        if (!codigo.trim()) return;

        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${processLogs}/${codigo}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error("Error al buscar logs");
            }

            const data = await res.json();
            setLogs(data);

            if (data.length === 0) {
                Swal.fire({
                    icon: "info",
                    title: "Sin Registros",
                    text: "No se encontraron registros para este pedido.",
                    timer: 2000
                });
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudieron cargar los registros.",
                confirmButtonColor: "#d33"
            });
        } finally {
            setLoading(false);
        }
    };

    const eliminarLog = async (logId, processType, source) => {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            html: `Esto eliminará el registro de <b>${processType}</b> (${source === 'history' ? 'Historial' : 'Activo'}).<br>El pedido podrá volver a pasar por esta etapa.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (!result.isConfirmed) return;

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${processLog}/${logId}?source=${source}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error("Error al eliminar log");
            }

            Swal.fire({
                icon: "success",
                title: "Eliminado",
                text: "El registro fue eliminado exitosamente.",
                timer: 1500,
                showConfirmButton: false
            });

            // Refresh logs
            //setLogs([]);
            //setCodigo("");
            buscarLogs();
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo eliminar el registro.",
                confirmButtonColor: "#d33"
            });
        }
    };

    const getProcessColor = (type) => {
        switch (type) {
            case "Preparacion": return "bg-green-100 text-green-800 border-green-300";
            case "Chequeo": return "bg-blue-100 text-blue-800 border-blue-300";
            case "Embalaje": return "bg-purple-100 text-purple-800 border-purple-300";
            default: return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center px-5 py-10">
            <h1 className="text-3xl font-semibold text-gray-800 mb-10 text-center">
                Panel de Administración
            </h1>

            <div className="w-full max-w-4xl bg-white rounded-xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-gray-700 mb-6">Gestión de Procesos</h2>

                <div className="flex gap-4 mb-6">
                    <Container style={{margin:'auto'}} textAlign="center">
                        <Form >
                            <Form.Group inline>
                                <Form.Input
                                    type="number"
                                    label="Número de Factura"
                                    placeholder="Ej. PED123"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && buscarLogs()}
                                />


                                <Button color="blue" size="small" onClick={buscarLogs} disabled={!codigo || loading} >Consultar</Button>

                            </Form.Group>
                        </Form>
                    </Container>

                </div>

                {logs.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">
                            Historial de Procesos - Factura: {codigo}
                        </h3>
                        <div className="space-y-3">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`p-4 rounded-lg border-2 ${getProcessColor(log.process_type)} flex justify-between items-center`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xl font-bold">{log.process_type}</span>
                                            <span className="text-sm opacity-75">
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${log.source === 'log' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
                                                {log.source === 'log' ? 'Activo' : 'Completado'}
                                            </span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div><span className="font-semibold">Usuario:</span> {log.username}</div>
                                            <div><span className="font-semibold">Trabajador:</span> {log.worker_number || "N/A"}</div>
                                            {log.cesta && <div><span className="font-semibold">Cesta:</span> {log.cesta}</div>}
                                            {log.bultos && <div><span className="font-semibold">Bultos:</span> {log.bultos}</div>}
                                            {log.guia && <div><span className="font-semibold">Guia:</span> {log.guia}</div>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => eliminarLog(log.id, log.process_type, log.source)}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
