import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Layout from "../components/Layout";

import { pedidosAdd, pedidosArticulos, pedidosConfirmar, pedidosFacturas, pedidosRelease, pedidosRemove, pedidosUpdate } from "../context/globalvars";
import { Input, Container, Button, Loader, Modal, Form } from "semantic-ui-react";

export default function Preparacion() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workerNumber, setWorkerNumber] = useState("");
  const [cesta, setCesta] = useState("");
   const user = JSON.parse(localStorage.getItem("user") || "{}");
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [newQuantity, setNewQuantity] = useState("1");
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [checkedItems, setCheckedItems] = useState({}); // To track items already picked in the basket

  const buscarPedido = async () => {
    setPage(1);
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
          processType: "Preparacion"
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
        console.log(data.renglones);
        
        data.renglones.sort((a, b) => a.co_color.localeCompare(b.co_color, undefined, { numeric: true, sensitivity: 'base' }));
      }

      setPedido(data);
      setCesta(data.cesta || "");
      setCheckedItems({}); // Reset checklist for the new order
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



  const handleSave = async () => {

    if (!pedido) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(pedidosUpdate, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        fact_num: pedido.fact_num,
        renglones: pedido.renglones
      })
    });
    console.log(pedido.renglones);

    const data = await res.json();
    console.log("Datos enviados:", { fact_num: pedido?.fact_num, renglones: pedido?.renglones });
    console.log("Respuesta del servidor:", data);
    try {
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { message: `Error del servidor (${res.status})` };
        }
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error al Guardar",
          text: errorData.message || "No se pudo actualizar el pedido.",
          confirmButtonColor: "#d33"
        });
        return;
      }
      setLoading(false);
      Swal.fire({
        icon: "success",
        title: "Guardado",
        text: "Los cambios han sido guardados correctamente.",
        timer: 1500,
        showConfirmButton: false
      });

    } catch (error) {
      console.error("Error al guardar cambios:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al guardar los cambios.",
      });
    }
  };

  const handleSearchArticles = async () => {
    if (!searchTerm) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${pedidosArticulos}/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectArticle = (art) => {
    setSelectedArticle(art);
    setSearchResults([]); // Clear results or keep them? keep cleaner
    setSearchTerm(""); // Reset search? No, maybe keep it. Let's clear to show selection.
  };

  const handleAddProduct = async () => {
    const quantity = parseInt(newQuantity);
    if (!selectedArticle || !quantity || quantity <= 0) {
      Swal.fire("Error", "Debe seleccionar un artículo y una cantidad válida.", "error");
      return;
    }

    if (quantity > selectedArticle.stock_act) {
      Swal.fire({
        icon: "error",
        title: "Stock Insuficiente",
        text: `La cantidad solicitada (${quantity}) excede el stock disponible (${selectedArticle.stock_act}).`,
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(pedidosAdd, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fact_num: pedido.fact_num,
          co_art: selectedArticle.co_art,
          total_art: newQuantity
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al agregar producto");

      Swal.fire("Agregado", "Producto agregado correctamente.", "success");
      setIsModalOpen(false);
      setSelectedArticle(null);
      setSearchTerm("");
      setSearchResults([]);
      setNewQuantity("1");
      // Refresh order
      buscarPedido();

    } catch (error) {
      console.error("Error agregando producto:", error);
      Swal.fire("Error", error.message, "error");
    }
  };

  const handleRemoveProduct = async (reng_num) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción eliminará el renglón del pedido.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar"
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(pedidosRemove, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fact_num: pedido.fact_num,
          reng_num: reng_num
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al eliminar producto");

      Swal.fire("Eliminado", "Producto eliminado correctamente.", "success");
      buscarPedido(); // Refresh order

    } catch (error) {
      console.error("Error eliminando producto:", error);
      Swal.fire("Error", error.message, "error");
    }
  };

  const enviarTrabajador = async () => {
    if (!workerNumber) {
      Swal.fire({
        icon: "warning",
        title: "Falta número de trabajador",
        text: "Por favor ingrese el número de trabajador que preparó el pedido.",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(pedidosConfirmar, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fact_num: String(pedido.fact_num).trim(),
          processType: "Preparacion",
          workerNumber: workerNumber,
          cesta: cesta,
          renglones: pedido.renglones
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al confirmar");
      }

      Swal.fire({
        icon: "success",
        title: "Completado",
        text: "Preparación confirmada exitosamente.",
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        // Reset form for next order
        setCodigo("");
        setPedido(null);
        setWorkerNumber("");
        setCesta("");
        setPage(1);
        setCheckedItems({});
        setSearchResults([]);
      });

    } catch (error) {
      console.error("Error confirming pedido:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message
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
          processType: "Preparacion"
        })
      });

      Swal.fire({
        icon: "info",
        title: "Cancelado",
        text: "El pedido ha sido liberado.",
        timer: 1500,
        showConfirmButton: false
      });

      setCodigo("");
      setPedido(null);
      setWorkerNumber("");
      setCesta("");
      setPage(1);
      setCheckedItems({});
      setSearchResults([]);

    } catch (error) {
      console.error("Error cancelando:", error);
      Swal.fire("Error", "No se pudo liberar el pedido.", "error");
    }
  };

  return (
    <>
      <Modal dimmer basic open={loading} >
        <Modal.Content>
          <Loader />
        </Modal.Content>
      </Modal>
      <div className="min-h-screen bg-gradient-to-br from-[#004aad]/80 via-[#458DFB]/70 to-[#43B0FC]/60 flex flex-col items-center px-5 py-10">
        <h1 className="text-3xl font-semibold text-white mb-10 text-center drop-shadow-lg">
          
        </h1>
        <div className="flex flex-col gap-6 w-full max-w-6xl">
          {/* Área de Preparación - Top Bar */}
          <div className="w-full bg-white rounded-xl p-6 shadow-2xl border border-[#458DFB]/60">
            <h2 className="text-2xl font-bold text-[#004aad]/80 mb-4 drop-shadow">Área de Preparación</h2>

            <div className="flex flex-wrap gap-6 items-end justify-between">
              {/* Left Group: Search Order */}
              <div className="flex flex-wrap gap-4 items-end flex-initial">
                <div className="w-full sm:w-48">
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
                </div>
              </div>

              {/* Middle Group: Worker and Cesta */}
              {pedido && (
                <div className="flex flex-wrap gap-4 items-end justify-center border-l-0 sm:border-l sm:border-r border-gray-200 px-0 sm:px-4 flex-initial w-full sm:w-auto">
                  <Form >

                    <Form.Input
                      label="N° Trabajador"
                      placeholder="Ej. 12345"
                      value={workerNumber}
                      onChange={(e) => setWorkerNumber(e.target.value)}
                    />

                    <Form.Input
                      label="N° Cesta"
                      placeholder="Ej. 5, 8, 10"
                      value={cesta}
                      min={1}
                      onChange={(e) => setCesta(e.target.value)}
                    />
                  </Form>
                </div>
              )}

              {/* Right Group: Actions */}
              {pedido && (
                <div className="flex flex-wrap gap-3 items-end flex-initial w-full sm:w-auto justify-end mb-4">
                  <div className="pb-1">
                    <Button
                      content="Cancelar"
                      onClick={handleCancel}
                      color="red"
                    />
                  </div>
                  <div className="pb-1">
                    <Button
                      content="Guardar"
                      onClick={handleSave}
                      color="green"
                    />
                  </div>
                  <div className="pb-1">
                    <Button
                      content="Confirmar"
                      onClick={enviarTrabajador}
                      disabled={!workerNumber}
                      color="teal"
                    />
                  </div>
                </div>
              )}

              {/* Placeholder if no pedido for spacing */}
              {!pedido && <div className="flex-1"></div>}
            </div>

            {/* Modal for Add Product */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                  <h3 className="text-xl font-bold mb-4">Agregar Producto</h3>

                  {/* Search Section */}
                  {!selectedArticle ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearchArticles()}
                          placeholder="Buscar por código o descripción..."
                          className="flex-1 border rounded p-2"
                          autoFocus
                        />
                        <button
                          onClick={handleSearchArticles}
                          className="bg-blue-500 text-white px-3 rounded hover:bg-blue-600"
                          disabled={isSearching}
                        >
                          {isSearching ? "..." : "Buscar"}
                        </button>
                      </div>

                      {/* Results List */}
                      <div className="max-h-60 overflow-y-auto border rounded mt-2">
                        {searchResults.map(art => (
                          <div
                            key={art.co_art}
                            onClick={() => handleSelectArticle(art)}
                            className="p-2 border-b hover:bg-blue-50 cursor-pointer text-sm"
                          >
                            <div className="font-bold text-gray-700">{art.art_des}</div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Código: {art.co_art}</span>
                              <span className={art.stock_act > 0 ? "text-green-600 font-bold" : "text-red-500"}>
                                Stock: {art.stock_act}
                              </span>
                            </div>
                          </div>
                        ))}
                        {searchResults.length === 0 && searchTerm && !isSearching && (
                          <div className="p-2 text-center text-gray-400 text-sm">Sin resultados</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Selected Article Section */
                    <div className="flex flex-col gap-4">
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <div className="font-bold text-lg text-blue-800">{selectedArticle.art_des}</div>
                        <div className="text-sm text-blue-600">Código: {selectedArticle.co_art}</div>
                        <div className="text-sm font-bold mt-1">Stock Disponible: {selectedArticle.stock_act}</div>
                        <button
                          onClick={() => setSelectedArticle(null)}
                          className="text-xs text-red-500 underline mt-2"
                        >
                          Cambiar Producto
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                        <input
                          type="number"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                          min="1"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedArticle(null);
                        setSearchTerm("");
                        setSearchResults([]);
                      }}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddProduct}
                      disabled={!selectedArticle}
                      className={`px-4 py-2 rounded text-white ${!selectedArticle ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información del Pedido */}
          {pedido && (
            <div className="flex-1 w-full bg-white rounded-xl p-8 shadow-2xl border border-[#458DFB]/60 flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-[#004aad]/80 mb-2 drop-shadow">Información de la Nota</h2>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div className="text-[#004aad]/80 font-semibold flex flex-col sm:flex-row gap-2 sm:gap-8">
                  <div><span className="font-bold">Cliente:</span> {pedido.co_cli}</div>
                  <div><span className="font-bold">Cantidad de ítems:</span> {pedido.renglones.length}</div>
                </div>
                <div className="w-full sm:w-auto">
                  <Button
                    content="+ Agregar Producto"
                    onClick={() => setIsModalOpen(true)}
                    color="olive"
                  />
                </div>
              </div>
              <div className="overflow-x-auto"> {/* Added overflow for safety */}
                <table className="w-full text-[#004aad]/80 text-base rounded-lg overflow-hidden shadow-lg">
                  <thead>
                    <tr className="bg-[#458DFB]/80 text-white">
                      <th className="px-3 py-2 text-center">✓</th>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Artículo</th>
                      <th className="px-3 py-2 text-left">Ubicación</th>
                      <th className="px-3 py-2 text-left">Lote</th>
                      <th className="px-3 py-2 text-left">F. Vencimiento</th>
                      <th className="px-3 py-2 text-left">Total</th>
                      <th className="px-3 py-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.renglones.map((reng, i) => {
                      const isChecked = checkedItems[reng.reng_num];
                      return (
                        <tr
                          key={i}
                          className={`transition-colors duration-200 ${isChecked
                            ? "bg-green-100 opacity-60"
                            : i % 2 === 0 ? "bg-[#43B0FC]/10" : "bg-[#6200a6]/10"
                            }`}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              className="w-5 h-5 cursor-pointer accent-green-600"
                              checked={!!isChecked}
                              onChange={() => setCheckedItems(prev => ({
                                ...prev,
                                [reng.reng_num]: !prev[reng.reng_num]
                              }))}
                            />
                          </td>
                          <td className={`px-3 py-2 font-bold text-[#004aad]/80 drop-shadow ${isChecked ? 'line-through' : ''}`}>
                            {i + 1}
                          </td>
                          <td className={`px-3 py-2 text-[#004aad]/80 drop-shadow ${isChecked ? 'line-through' : ''}`}>
                            <div className="font-bold">{reng.co_art}</div>
                            <div className="text-xs text-gray-500">{reng.ref || "N/A"}</div>
                          </td>
                          <td className={`px-3 py-2 text-[#004aad]/80 drop-shadow ${isChecked ? 'line-through' : ''}`}>
                            {reng.co_color}
                          </td>
                          <td className="px-3 py-2 text-[#004aad]/80 drop-shadow">
                            {reng.available_lots && reng.available_lots.length > 0 ? (
                              <select
                                className="border rounded px-1 bg-white max-w-[150px]"
                                disabled={isChecked}
                                value={reng.nro_lote}
                                onChange={(e) => {
                                  const selectedLotNum = e.target.value;
                                  const selectedLotData = reng.available_lots.find(l => l.nro_lote === selectedLotNum);

                                  const newRenglones = [...pedido.renglones];
                                  newRenglones[i].nro_lote = selectedLotNum;

                                  if (selectedLotData) {
                                    newRenglones[i].fec_lote = selectedLotData.fec_lote;
                                  }

                                  setPedido({ ...pedido, renglones: newRenglones });
                                }}
                              >
                                <option value={reng.nro_lote}>{reng.nro_lote} (Actual)</option>
                                {reng.available_lots.map(l => (
                                  <option key={l.nro_lote} value={l.nro_lote}>
                                    {l.nro_lote} ({l.stock_act})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={isChecked ? 'line-through' : ''}>{reng.nro_lote}</span>
                            )}
                          </td>
                          <td className={`px-3 py-2 text-[#004aad]/80 drop-shadow ${isChecked ? 'line-through' : ''}`}>
                            {reng.fec_lote}
                          </td>
                          <td className="px-3 py-2 font-bold text-[#004aad]/80 drop-shadow">
                            <input
                              type="number"
                              min={1}
                              className="w-20 border rounded px-1 text-center"
                              disabled={isChecked}
                              value={reng.total_art}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newQty = parseInt(val) || 0;

                                // Find max stock for the current lot
                                // If available_lots is undefined or empty, we skip validation (or assume infinite/no check)
                                // to prevent blocking the user if data is missing.
                                const currentLotData = (reng.available_lots && reng.available_lots.length > 0)
                                  ? reng.available_lots.find(l => l.nro_lote === reng.nro_lote)
                                  : null;

                                const maxStock = currentLotData ? currentLotData.stock_act : null;

                                if (maxStock !== null && newQty > maxStock) {
                                  Swal.fire({
                                    icon: "warning",
                                    title: "Stock Excedido",
                                    text: `Solo hay ${maxStock} unidades disponibles en el lote ${reng.nro_lote}.`,
                                    toast: true,
                                    position: 'top-end',
                                    showConfirmButton: false,
                                    timer: 3000
                                  });
                                  const newRenglones = [...pedido.renglones];
                                  newRenglones[i].total_art = maxStock;
                                  setPedido({ ...pedido, renglones: newRenglones });
                                } else {
                                  const newRenglones = [...pedido.renglones];
                                  newRenglones[i].total_art = val;
                                  setPedido({ ...pedido, renglones: newRenglones });
                                }
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleRemoveProduct(reng.reng_num)}
                              className="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
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
    </>
  );
}
