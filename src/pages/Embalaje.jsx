import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Input from "../components/Input";
import { pedidosConfirmar, pedidosFacturas, pedidosLabel, pedidosRelease } from "../context/globalvars";
import { Container, Modal, Table, Button, Form } from "semantic-ui-react";



export default function Embalaje() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [pedido, setPedido] = useState(null);
  const [info, setInfo] = useState(null);
  const [workerNumber, setWorkerNumber] = useState("");

  const [pdfUrl, setPdfUrl] = useState(null);
  const [bultos, setBultos] = useState("");
  const [open, setOpen] = useState(false);

  const buscarPedido = async () => {

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
          processType: "Embalaje"
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
      setInfo(data);

      // Load PDF preview
      try {
        const pdfRes = await fetch(`${pedidosLabel}/${codigo}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          const url = window.URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (pdfError) {
        console.error("Error loading PDF preview:", pdfError);
      }
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

  const imprimirEtiqueta = async (factNum, numBultos) => {
    try {
      const token = localStorage.getItem("token");
      const totalBultos = parseInt(numBultos) || 1;

      // Generate single PDF with multiple pages
      const res = await fetch(`${pedidosLabel}/${factNum}?totalBultos=${totalBultos}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`No se pudo generar las etiquetas`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      //const outputFilename = `Etiquetas-${factNum}-${totalBultos}-bultos.pdf`;

      setPdfUrl(url);
      setOpen(true);
      // Open in new tab for printing
      /*
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', outputFilename);
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
      */

    } catch (error) {
      console.error("Error printing label:", error);
      Swal.fire({
        icon: "error",
        title: "Error de Impresión",
        text: error.message || "No se pudo generar el PDF de la etiqueta.",
      });
    }
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
          processType: "Embalaje",
          workerNumber,
          bultos
        })
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
          buscarPedido();
        } catch (e) {
          errorData = { message: `Error del servidor (${res.status}): ${res.statusText}` };
        }

        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorData.message || "Error al confirmar el embalaje",
          confirmButtonColor: "#d33"
        });
        return;
      }

      // Éxito: Generar etiqueta y luego salir
      await imprimirEtiqueta(codigo, bultos);

      Swal.fire({
        icon: "success",
        title: "Completado",
        text: "Embalaje confirmado y etiqueta generada.",
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        // Reset form for next order
        setCodigo("");
        setPedido(null);
        setWorkerNumber("");
        setBultos("");

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
          processType: "Embalaje"
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
      setBultos("");
      setPdfUrl(null);

    } catch (error) {
      console.error("Error cancelando:", error);
      Swal.fire("Error", "No se pudo liberar el pedido.", "error");
    }
  };

  const renglones = pedido ? pedido.renglones || [] : [];
  const paginatedRenglones = renglones;

  return (
    <>
      {open &&
        <Modal open={open} onClose={() => {

          setOpen(false)
        }} size="fullscreen" >
          <Modal.Content  >
            <Table size="small" compact  >
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Factura:</Table.HeaderCell>
                  <Table.Cell>{info.fact_num}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.HeaderCell>Cliente:</Table.HeaderCell>
                  <Table.Cell>{info.co_cli}</Table.Cell>
                </Table.Row>
              </Table.Header>
            </Table>
          </Modal.Content>
          <Modal.Content style={{ padding: '0' }} >

            {info && (
              <Container fluid>


                {pdfUrl ? (
                  <div className="flex-1 min-h-[600px] border-2 border-[#6200a6]/20 rounded-lg overflow-hidden">
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full min-h-[600px]"
                      title="Vista Previa de Etiqueta"
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-[600px] flex items-center justify-center border-2 border-dashed border-[#6200a6]/20 rounded-lg">
                    <div className="text-center text-[#6200a6]/60">
                      <div className="text-4xl mb-4">📄</div>
                      <div className="text-lg font-semibold">Cargando vista previa...</div>
                    </div>
                  </div>
                )}
              </Container>
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button color="red" onClick={() => {

              setOpen(false);
            }}>Cerrar</Button>
          </Modal.Actions>
        </Modal>

      }
      <div className="min-h-screen bg-gradient-to-br from-[#6200a6]/80 via-[#458DFB]/60 to-[#43B0FC]/40 flex flex-col items-center px-5 py-10" >
        <h1 className="text-3xl font-semibold text-white mb-10 text-center drop-shadow-lg">
          Embalaje de Pedido
        </h1>
        <div className="flex flex-row gap-8 w-full max-w-6xl justify-center">
          {/* Área de Embalaje */}
          <div className="w-96 bg-white rounded-xl p-8 shadow-2xl border border-[#6200a6]/40 flex flex-col gap-6 items-center">
            <h2 className="text-2xl font-bold text-[#6200a6]/80 mb-2 drop-shadow">Área de Embalaje</h2>

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
              <>
                <Form.Input
                  label="Número de Trabajador"
                  placeholder="Ej. 12345"
                  value={workerNumber}
                  onChange={(e)=>setWorkerNumber(e.target.value)}
                /> 

                <Form.Input
                  value={bultos}
                  min={1}
                  label="Cantidad de Bultos"
                  placeholder="Ej. 1, 2, 3..."
                  type="number"
                  onChange={(e) => setBultos(e.target.value)}
                />
                <Button
                  content="Confirmar Embalaje"
                  onClick={enviarTrabajador}
                  disabled={!workerNumber || !bultos}
                  color="teal"
                />
                <div className="mt-2 text-center w-full">
                  <button
                    onClick={handleCancel}
                    className="text-red-500 hover:text-red-700 underline text-sm"
                  >
                    Cancelar / Liberar Pedido
                  </button>
                </div>
              </>
            )}
            {pdfUrl &&
              <Button onClick={() => { setOpen(true); }} color="teal" >Vista previa({info.fact_num})</Button>
            }
          </div>

          {/* Información del Pedido */}

        </div>
      </div >
    </>
  );
}
