import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Container,
  Modal,
  Table,
  Button,
  Form,
  Grid,
  Card,
  Header,
  Segment,
  Sticky,
  Select
} from "semantic-ui-react";
import Input from "../components/Input";
import {
  pedidosConfirmar,
  pedidosFacturas,
  pedidosLabel,
  pedidosRelease,
  crearguia,
  guiapdf
} from "../context/globalvars";
import { useEffect } from "react";
const apikey = import.meta.env.VITE_API_KEY;

export default function Despacho() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  // Estados
  const [codigo, setCodigo] = useState("");
  const [pedido, setPedido] = useState(null);
  const [info, setInfo] = useState(null);
  const [workerNumber, setWorkerNumber] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [bultos, setBultos] = useState("");
  const [open, setOpen] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [selectedGuiaId, setSelectedGuiaId] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  const [rutas, setRutas] = useState([]);
  const [selruta, setSelRuta] = useState({});

  // 1. Cargar las rutas existentes al entrar a la página
  // useEffect(() => {
  //   fetchRutas();
  // }, []);

  // const fetchRutas = async () => {
  //   try {

  //     const response = await fetch(listarutas, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Accept': 'application/json'
  //       },
  //       body: JSON.stringify({ apikey: apikey, type: 1 })
  //     });
  //     const data = await response.json();


  //     const rutas = data.datos.map(item => ({
  //       key: item.TABL_Id,
  //       text: item.TABL_Descripcion,
  //       value: item,
  //     }));
  //     console.log(data.datos);

  //     setRutas(rutas ?? []);
  //   } catch (error) {
  //     console.error("Error cargando rutas:", error);
  //   }
  // };

  // Buscar pedido por código manual o escaneado
  const buscarPedido = async (scannedCode = null) => {
    let code = null;
    if (showScanner) {
      code = scannedCode || codigo;
    } else {

      code = codigo || scannedCode;
    }
    if (!code) return;
    // Verificar si el pedido ya existe en la lista
    const existPed = pedidos.find((f) => f.fact_num === code);
    if (existPed) {
      if (existPed.cargado < existPed.bultos) {
        const updatedPedidos = pedidos.map((ped) =>
          ped.fact_num === code ? { ...ped, cargado: ped.cargado + 1 } : ped
        );
        setPedidos(updatedPedidos);
        toast.info("Bulto agregado");
      } else {
        toast.error("El pedido ya se encuentra en la guía");
      }
      return;
    }

    // Si no existe, buscar en el servidor
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
    console.log({
      fact_num: code,
      processType: "En guia",
    });

    try {
      const res = await fetch(pedidosFacturas, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fact_num: code,
          processType: "En guia",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          const { user, area, since } = errorData.details || {};
          toast.warning(
            `Este pedido está siendo procesado por <b>${user || "otro usuario"
            }</b> en el área de <b>${area || "Desconocida"
            }</b>.<br>Desde: ${since ? new Date(since).toLocaleString() : "Desconocido"
            }`
          );
        } else if (res.status === 400) {
          toast.error(errorData.message || "Error de Secuencia");
        } else {
          toast.error(errorData.message || "Error al buscar el pedido");
        }
        return;
      }

      const data = await res.json();

      // Ordenar renglones por co_color
      if (data.renglones) {
        data.renglones.sort((a, b) =>
          a.co_color.localeCompare(b.co_color, undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
      }

      const ped = { ...data, cargado: 1 };
      setPedidos([...pedidos, ped]);
      setInfo(data);
      toast.info(`Pedido ${codigo} agregado a la guía.`);

      // Reiniciar el escáner si está activo
      if (scannerRef.current) {
        setScannerKey((prevKey) => prevKey + 1);
      }
    } catch (error) {
      console.error("Error al buscar el pedido:", error);
      Swal.fire({
        icon: "error",
        title: "Error de Conexión",
        text: "No se pudo conectar con el servidor.",
        confirmButtonColor: "#d33",
      });
    }
  };


  // Ver PDF de la guía
  const verpdf = async (guiaId) => {
    try {
      setSelectedGuiaId(guiaId);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token no encontrado");

      const res = await fetch(guiapdf, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ guia: guiaId }),
      });

      if (!res.ok) throw new Error(`Error al cargar PDF: ${res.statusText}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setOpen(true);
    } catch (err) {
      console.error("Error al cargar PDF:", err);
      toast.error(`Error al cargar PDF: ${err.message}`);
    }
  };

  // Generar guía de despacho
  const nuevaGuiaRed = async (guia,) => {
    const token = localStorage.getItem("token");
    const res = await fetch(crearguia, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pedidos, selruta }),
    });
  }

  const generarGuia = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(crearguia, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pedidos, selruta }),
      });
      const datos = await res.json();
      setPedidos([]);

      //nuevaGuiaRed(datos.guia,datos.bruto,datos.iva,datos,neto);
      verpdf(datos.guia);

      Swal.fire({
        icon: "success",
        title: "Completado",
        text: "Guía generada.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error al generar la guía:", error);
      Swal.fire({
        icon: "error",
        title: "Error de Conexión",
        text: "No se pudo conectar con el servidor.",
        confirmButtonColor: "#d33",
      });
    }
  };

  // Cancelar pedido
  const handleCancel = async () => {
    try {
      if (!pedido) return;
      const token = localStorage.getItem("token");

      await fetch(pedidosRelease, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fact_num: pedido.fact_num,
          processType: "Embalaje",
        }),
      });

      Swal.fire({
        icon: "info",
        title: "Cancelado",
        text: "El pedido ha sido liberado.",
        timer: 1500,
        showConfirmButton: false,
      });

      // Resetear estados
      setCodigo("");
      setPedido(null);
      setWorkerNumber("");
      setBultos("");
      setPdfUrl(null);
    } catch (error) {
      console.error("Error al cancelar:", error);
      Swal.fire("Error", "No se pudo liberar el pedido.", "error");
    }
  };

  // Manejar escaneo de código QR
  const handleScan = async (result) => {
    if (result && result.length > 0) {
      const code = result[0].rawValue;
      await buscarPedido(code);
    }
  };

  // Manejar errores del escáner
  const handleError = (err) => {
    console.error("Error en el escáner:", err);
  };

  // Renderizado
  return (
    <>
      {/* Modal del escáner */}
      {showScanner && (
        <Modal open={showScanner} onClose={() => setShowScanner(false)} size="small">
          <Modal.Header>Escáner de Código de Barras</Modal.Header>
          <Modal.Content>
            <Scanner
              onScan={handleScan}
              onError={handleError}
              style={{ width: "100%", height: "100%" }}
              ref={scannerRef}
              key={scannerKey}
            />
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={() => setShowScanner(false)}>Cerrar</Button>
          </Modal.Actions>
        </Modal>
      )}

      {/* Modal del PDF */}
      {open && (
        <Modal
          size="fullscreen"
          open={open}
          onClose={() => {
            setOpen(false);
            window.URL.revokeObjectURL(pdfUrl);
          }}
        >
          <Modal.Header>Guía #{selectedGuiaId}</Modal.Header>
          <Modal.Content>
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
          </Modal.Content>
          <Modal.Actions>
            <Button
              color="red"
              onClick={() => {
                setOpen(false);
                window.URL.revokeObjectURL(pdfUrl);
              }}
            >
              Cerrar
            </Button>
          </Modal.Actions>
        </Modal>
      )}

      {/* Contenido principal */}
      <Segment padded style={{ minHeight: "100vh" }}>
        <Container>
          <Header as="h1">Despacho de Pedidos</Header>
          <Grid centered>
            <Grid.Column computer={4} tablet={6} mobile={16}>
              <Sticky>
                <Card>
                  <Card.Content>
                    <Form>
                      Numero de pedido
                      <Form.Group >
                        <Form.Input
                        width={14}
                          fluid
                          type="number"
                           
                          placeholder="Ej. PED123"
                          value={codigo}
                          onChange={(e) => setCodigo(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && buscarPedido()
                          }

                        />
                        <Button
                          type="button"
                          icon="qrcode"
                          color="blue"
                          onClick={() => setShowScanner(true)}
                        />
                      </Form.Group>
                      <Form.Button
                        type="button"
                        color="blue"
                        size="small"
                        onClick={buscarPedido}
                        disabled={!codigo}
                      >
                        Consultar
                      </Form.Button>
                    </Form>
                  </Card.Content>
                </Card>
              </Sticky>
            </Grid.Column>

            {/* Tabla de pedidos */}
            {pedidos.length > 0 && (
              <Grid.Column computer={12} tablet={10} mobile={16}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                  <Select options={rutas}
                    placeholder="Seleccionar ruta"
                    onChange={(e, { value }) => setSelRuta(value)}
                  />
                  <Button color="blue" onClick={generarGuia}>
                    Despachar {pedidos.length} pedidos
                  </Button>
                  <Button color="red" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>

                <Table compact size="small">
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Pedido</Table.HeaderCell>
                      <Table.HeaderCell>Cliente</Table.HeaderCell>
                      <Table.HeaderCell>Bultos</Table.HeaderCell>
                      <Table.HeaderCell>Productos</Table.HeaderCell>
                      <Table.HeaderCell></Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {pedidos.map((l) => (
                      <Table.Row key={l.fact_num}>
                        <Table.Cell>{l.fact_num}</Table.Cell>
                        <Table.Cell>{l.co_cli}</Table.Cell>
                        <Table.Cell>
                          {l.cargado}/{l.bultos}
                        </Table.Cell>
                        <Table.Cell>{l.renglones?.length || 0}</Table.Cell>
                        <Table.Cell textAlign="right">
                          <Button
                            icon="trash"
                            basic
                            color="red"
                            onClick={() =>
                              setPedidos(
                                pedidos.filter((f) => f.fact_num !== l.fact_num)
                              )
                            }
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Grid.Column>
            )}
          </Grid>
        </Container>
      </Segment>
    </>
  );
}
