import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Input from "../components/Input";

import { pedidosConfirmar, pedidosFacturas, pedidosRelease } from "../context/globalvars";
import { Form,Button } from "semantic-ui-react";



export default function Chequeo() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [pedido, setPedido] = useState(null);
  const [workerNumber, setWorkerNumber] = useState("");


  // Scanning State
  const [scannedData, setScannedData] = useState({}); // { reng_num: quantity_scanned }
  const [scanInput, setScanInput] = useState("");
  const scanInputRef = useRef(null);

  // Scroll Ref
  const itemRefs = useRef({});

  // Focus keeper
  useEffect(() => {
    if (pedido && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [pedido, scannedData]);

  const buscarPedido = async () => {
    itemRefs.current = {}; // Clear refs
    setScannedData({});
    setScanInput("");
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Acceso Denegado",
        text: "No estás autenticado. Por favor inicia sesión.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    try {
      const res = await fetch(pedidosFacturas, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fact_num: codigo,
          processType: "Chequeo"
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          const { user, area, since } = errorData.details || {};
          Swal.fire({
            icon: "warning",
            title: "Pedido Bloqueado",
            html: `Este pedido está siendo procesado por <b>${user || 'otro usuario'}</b> en el área de <b>${area || 'Desconocida'}</b>.<br>Desde: ${since ? new Date(since).toLocaleString() : 'Desconocido'}`,
            confirmButtonColor: "#f59e0b"
          });
        } else if (res.status === 400) {
          Swal.fire({
            icon: "error",
            title: "Error de Secuencia",
            text: errorData.message,
            confirmButtonColor: "#d33"
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorData.message || "Error al buscar el pedido",
            confirmButtonColor: "#d33"
          });
        }
        return;
      }

      const data = await res.json();

      // Sort renglones alphabetically/numerically by co_color (Ubicación)
      if (data.renglones) {
        data.renglones.sort((a, b) => a.co_color.localeCompare(b.co_color, undefined, { numeric: true, sensitivity: 'base' }));
      }

      setPedido(data);
    } catch (error) {
      console.error("Error fetching pedido:", error);
      Swal.fire({
        icon: "error",
        title: "Error de Conexión",
        text: "No se pudo conectar con el servidor.",
        confirmButtonColor: "#d33"
      });
    }
  };

  const handleScan = (e) => {
    if (e.key === 'Enter') {
      const value = scanInput.trim();
      if (!value) return;

      // Find matching item
      // Logic: Match 'ref' (barcode) or fallback to 'co_art_code' (internal code)
      const targetReng = pedido.renglones.find(r =>
        (r.ref && r.ref.trim() === value) ||
        (r.co_art_code && r.co_art_code.trim() === value)
      );

      if (targetReng) {
        const currentScanned = scannedData[targetReng.reng_num] || 0;
        const totalNeeded = targetReng.total_art;

        if (currentScanned < totalNeeded) {
          setScannedData(prev => ({
            ...prev,
            [targetReng.reng_num]: currentScanned + 1
          }));

          // Toast Feedback
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
          });
          Toast.fire({
            icon: 'success',
            title: `Escaneado: ${targetReng.co_art}`
          });

          // Auto-scroll to item
          const el = itemRefs.current[targetReng.reng_num];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add momentary highlight
            el.classList.add('bg-yellow-200');
            setTimeout(() => el.classList.remove('bg-yellow-200'), 1000);
          }

        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Completo',
            text: 'Este artículo ya está completo.',
            timer: 1500,
            showConfirmButton: false
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'No encontrado',
          text: 'El código escaneado no pertenece a este pedido.',
          timer: 1500,
          showConfirmButton: false
        });
      }

      setScanInput(""); // Clear input
    }
  };

  const isOrderComplete = () => {
    if (!pedido) return false;
    return pedido.renglones.every(r => (scannedData[r.reng_num] || 0) >= r.total_art);
  };

  const enviarTrabajador = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(pedidosConfirmar, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fact_num: codigo,
          processType: "Chequeo",
          workerNumber
        })
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { message: `Error del servidor (${res.status}): ${res.statusText}` };
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.message || "Error al confirmar el chequeo",
          confirmButtonColor: "#d33"
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Completado",
        text: "Chequeo confirmado exitosamente.",
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        // Reset form for next order
        setCodigo("");
        setPedido(null);
        setWorkerNumber("");
        setScannedData({});
        setScanInput("");

      });

    } catch (error) {
      console.error("Error confirming pedido:", error);
      Swal.fire({
        icon: "error",
        title: "Error de Conexión",
        text: "No se pudo conectar con el servidor.",
        confirmButtonColor: "#d33"
      });
    }
  };

  const handleCancel = async () => {
    try {
      if (!pedido) return;
      const token = localStorage.getItem("token");

      await fetch(pedidosRelease, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fact_num: pedido.fact_num,
          processType: "Chequeo"
        })
      });

      Swal.fire({
        icon: "info",
        title: "Cancelado",
        text: "El pedido ha sido liberado.",
        timer: 1500,
        showConfirmButton: false
      });

      // Reset
      setCodigo("");
      setPedido(null);
      setWorkerNumber("");
      setScannedData({});
      setScanInput("");

    } catch (error) {
      console.error("Error cancelando:", error);
      Swal.fire("Error", "No se pudo liberar el pedido.", "error");
    }
  };

  const renglones = pedido?.renglones || [];
  const paginatedRenglones = renglones;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#43B0FC]/80 via-[#458DFB]/60 to-[#004aad]/40 flex flex-col items-center px-5 py-10">
      <h1 className="text-3xl font-semibold text-white mb-10 text-center drop-shadow-lg">
        Chequeo de Pedido
      </h1>
      <div className="flex flex-row gap-8 w-full max-w-6xl justify-center">
        {/* Área de Chequeo */}
        <div className="w-96 bg-white rounded-xl p-8 shadow-2xl border border-[#43B0FC]/40 flex flex-col gap-6 items-center sticky top-10 self-start">
          <h2 className="text-2xl font-bold text-[#43B0FC]/80 mb-2 drop-shadow">Área de Chequeo</h2>

          <Form.Group>
            <Form.Input
              type="number"
              label="Código de Pedido"
              placeholder="Ej. PED123"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buscarPedido()}
            />


            <Button color="blue" size="small" onClick={buscarPedido} disabled={!codigo} >Consultar</Button>

          </Form.Group>
          {pedido && (
            <div className="w-full border-t pt-4">
              <div className="mb-4">
                <label className="block text-[#004aad] font-medium mb-2">Escáner de Código</label>
                <input
                  ref={scanInputRef}
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={handleScan}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-2 border-[#43B0FC] text-[#004aad] focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Escanear producto..."
                  autoFocus
                />
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-[#004aad] font-medium mb-2 text-sm">O ingresa cantidad manualmente:</label>
                <div className="text-xs text-gray-600 mb-2">Haz clic en un producto de la tabla para seleccionarlo</div>
                {Object.keys(scannedData).length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pedido.renglones.map(reng => {
                      const scanned = scannedData[reng.reng_num] || 0;
                      const total = reng.total_art;
                      if (scanned >= total) return null;

                      return (
                        <div key={reng.reng_num} className="flex items-center gap-2 bg-white p-2 rounded">
                          <div className="flex-1 text-sm">
                            <div className="font-bold text-[#004aad]">{reng.co_art}</div>
                            <div className="text-xs text-gray-500">Faltan: {total - scanned} de {total}</div>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={total - scanned}
                            placeholder="Cant."
                            className="w-20 px-2 py-1 border-2 border-blue-300 rounded text-center"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const qty = parseInt(e.target.value) || 0;
                                if (qty > 0 && qty <= (total - scanned)) {
                                  setScannedData(prev => ({
                                    ...prev,
                                    [reng.reng_num]: scanned + qty
                                  }));
                                  e.target.value = '';

                                  const Toast = Swal.mixin({
                                    toast: true,
                                    position: 'top-end',
                                    showConfirmButton: false,
                                    timer: 1000,
                                    timerProgressBar: true,
                                  });
                                  Toast.fire({
                                    icon: 'success',
                                    title: `+${qty} ${reng.co_art}`
                                  });
                                }
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Input
                label="Número de Trabajador"
                placeholder="Ej. 12345"
                value={workerNumber}
                onChange={setWorkerNumber}
              />
              <Button
                label="Confirmar Chequeo"
                onClick={enviarTrabajador}
                disabled={!workerNumber || !isOrderComplete()}
                className={!isOrderComplete() ? "opacity-50 cursor-not-allowed" : ""}
              />
              <div className="mt-2 text-center w-full">
                <button
                  onClick={handleCancel}
                  className="text-red-500 hover:text-red-700 underline text-sm"
                >
                  Cancelar / Liberar Pedido
                </button>
              </div>
              {!isOrderComplete() && (
                <p className="text-xs text-red-500 text-center mt-2">
                  Debe escanear todos los productos para confirmar.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Información del Pedido */}
        {pedido && (
          <div className="flex-1 bg-white rounded-xl p-8 shadow-2xl border border-[#43B0FC]/40 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-[#43B0FC]/80 mb-2 drop-shadow">Información de la Nota</h2>
            <div className="mb-4 text-[#004aad]/80 font-semibold">
              <div><span className="font-bold">Cantidad de ítems:</span> {renglones.length}</div>
              <div><span className="font-bold">Código de Cliente:</span> {pedido.co_cli}</div>
              {pedido.cesta && (
                <div className="mt-3 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🧺</span>
                    <div>
                      <div className="text-xs font-semibold text-yellow-700 uppercase">Número de Cesta</div>
                      <div className="text-3xl font-extrabold text-yellow-900">{pedido.cesta}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <table className="w-full text-[#43B0FC]/80 text-base rounded-lg overflow-hidden shadow-lg">
                <thead>
                  <tr className="bg-[#43B0FC]/80 text-white">
                    <th className="px-2 py-1 text-left">#</th>
                    <th className="px-2 py-1 text-left">Artículo</th>
                    <th className="px-2 py-1 text-left">Ubicación</th>
                    <th className="px-2 py-1 text-left">Lote</th>
                    <th className="px-2 py-1 text-left">F. Vencimiento</th>
                    <th className="px-2 py-1 text-center">Progreso</th>
                    <th className="px-2 py-1 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRenglones.map((reng, i) => {
                    const scanned = scannedData[reng.reng_num] || 0;
                    const total = reng.total_art;
                    const isComplete = scanned >= total;

                    return (
                      <tr
                        key={i}
                        ref={el => itemRefs.current[reng.reng_num] = el}
                        className={`
                        ${i % 2 === 0 ? "bg-[#43B0FC]/10" : "bg-[#6200a6]/10"}
                        ${isComplete ? "bg-green-100 border-l-4 border-green-500" : ""}
                        transition-colors duration-500
                      `}>
                        <td className="px-2 py-1 font-bold text-[#004aad]/80 drop-shadow">{i + 1}</td>
                        <td className="px-2 py-1 text-[#004aad]/80 drop-shadow">
                          <div className="font-bold">{reng.co_art}</div>
                          <div className="text-xs text-gray-400">Ref: {reng.ref || "N/A"}</div>
                        </td>
                        <td className="px-2 py-1 text-[#004aad]/80 drop-shadow">{reng.co_color}</td>
                        <td className="px-2 py-1 text-[#004aad]/80 drop-shadow">{reng.nro_lote}</td>
                        <td className="px-2 py-1 text-[#004aad]/80 drop-shadow">{reng.fec_lote}</td>
                        <td className="px-2 py-1 text-center font-bold text-[#004aad]/80 drop-shadow">
                          {scanned} / {total}
                        </td>
                        <td className="px-2 py-1 text-center">
                          {isComplete ? (
                            <span className="text-green-600 font-bold text-xl">✓</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
