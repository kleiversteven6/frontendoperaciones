import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Form,
  Button,
  Grid,
  Segment,
  Container,
  Input,
  Table,
  Label,
  Header,
  Icon,
  Message,
  Modal
} from "semantic-ui-react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { pedidosConfirmar, pedidosFacturas, pedidosRelease } from "../context/globalvars";

export default function Chequeo() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [pedido, setPedido] = useState(null);
  const [workerNumber, setWorkerNumber] = useState("");
  const [scannedData, setScannedData] = useState({});
  const [scanInput, setScanInput] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const scanInputRef = useRef(null);
  const itemRefs = useRef({});

  // Focus keeper
  useEffect(() => {
    if (pedido && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [pedido, scannedData]);

  const buscarPedido = async () => {
    itemRefs.current = {};
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

          const el = itemRefs.current[targetReng.reng_num];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight-row');
            setTimeout(() => el.classList.remove('highlight-row'), 1000);
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

      setScanInput("");
    }
  };

  const handleBarcodeScan = (result) => {
    console.log(result);
    
    if (result) {
      setScanInput(result);
      setShowScanner(false);
      handleScan({ key: 'Enter', target: { value: result } });
    }
  };

  const handleError = (err) => {
    console.error("Error en el escáner:", err);
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

  return (
    <div style={{ background: 'linear-gradient(to bottom right, #43B0FC, #004aad)', minHeight: '100vh', padding: '2rem' }}>
      <Header as='h1' textAlign='center' style={{ color: 'white', marginBottom: '2rem' }}>
        Chequeo de Pedido
      </Header>

      <Grid stackable>
        {/* Área de Chequeo */}
        <Grid.Column width={4}>
          <Segment>
            <Header as='h2' style={{ color: '#43B0FC' }}>Área de Chequeo</Header>

            <Form>
              <Form.Group>
                <Form.Input
                  label="Código de Pedido"
                  placeholder="Ej. PED123"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && buscarPedido()}
                  width={14}
                  type="number"
                />
                <Button
                  icon="search"
                  color="blue"
                  onClick={buscarPedido}
                  disabled={!codigo}
                  style={{ marginTop: '1.7rem' }}
                />
              </Form.Group>
            </Form>

            {pedido && (
              <Container>
                <Form>
                  <Form.Group style={{ marginTop: '1rem' }}>
                    <Form.Input
                      label="Escáner de Código"
                      width={12}
                      ref={scanInputRef}
                      value={scanInput}
                      onChange={e => setScanInput(e.target.value)}
                      onKeyDown={handleScan}
                      placeholder="Escanear producto..."
                      fluid
                      action={
                        <Button
                          icon="qrcode"
                          color="blue"
                          onClick={() => setShowScanner(true)}
                        />
                      }
                    />
                  </Form.Group>
                </Form>

                <Segment style={{ marginTop: '1rem', backgroundColor: '#f8f9fa' }}>
                  <Label style={{ color: '#004aad', fontWeight: 'bold' }}>Ingresa cantidad manualmente:</Label>
                  <p style={{ fontSize: '0.8em', color: '#6c757d' }}>Haz clic en un producto de la tabla para seleccionarlo</p>
                  {Object.keys(scannedData).length > 0 && (
                    <div style={{ maxHeight: '160px', overflowY: 'auto', marginTop: '0.5rem' }}>
                      {pedido.renglones.map(reng => {
                        const scanned = scannedData[reng.reng_num] || 0;
                        const total = reng.total_art;
                        if (scanned >= total) return null;

                        return (
                          <div key={reng.reng_num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', color: '#004aad' }}>{reng.co_art}</div>
                              <div style={{ fontSize: '0.8em', color: '#6c757d' }}>Faltan: {total - scanned} de {total}</div>
                            </div>
                            <Input
                              type="number"
                              min="0"
                              max={total - scanned}
                              placeholder="Cant."
                              style={{ width: '80px' }}
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
                </Segment>

                <Form style={{ marginTop: '1rem' }}>
                  <Form.Input
                    label="Número de Trabajador"
                    placeholder="Ej. 12345"
                    value={workerNumber}
                    onChange={(e) => setWorkerNumber(e.target.value)}
                  />
                  <Button
                    primary
                    onClick={enviarTrabajador}
                    disabled={!workerNumber || !isOrderComplete()}
                    style={{ marginTop: '1rem' }}
                  >
                    Confirmar Chequeo
                  </Button>
                </Form>

                <Button
                  basic
                  color="red"
                  onClick={handleCancel}
                  style={{ marginTop: '1rem' }}
                >
                  Cancelar / Liberar Pedido
                </Button>

                {!isOrderComplete() && (
                  <Message warning style={{ marginTop: '1rem' }}>
                    Debe escanear todos los productos para confirmar.
                  </Message>
                )}
              </Container>
            )}
          </Segment>
        </Grid.Column>

        {/* Información del Pedido */}
        {pedido && (
          <Grid.Column width={12}>
            <Segment>
              <Header as='h2' style={{ color: '#43B0FC' }}>Información de la Nota</Header>
              <div style={{ marginBottom: '1rem', color: '#004aad' }}>
                <p><strong>Cantidad de ítems:</strong> {renglones.length}</p>
                <p><strong>Código de Cliente:</strong> {pedido.co_cli}</p>
                {pedido.cesta && (
                  <Segment style={{ backgroundColor: '#fff3cd', borderColor: '#ffeeba', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Icon name="shopping basket" size="big" color="yellow" />
                      <div>
                        <div style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#856404' }}>NÚMERO DE CESTA</div>
                        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#856404' }}>{pedido.cesta}</div>
                      </div>
                    </div>
                  </Segment>
                )}
              </div>

              <Table celled striped style={{ marginTop: '1rem' }}>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>#</Table.HeaderCell>
                    <Table.HeaderCell>Artículo</Table.HeaderCell>
                    <Table.HeaderCell>Ubicación</Table.HeaderCell>
                    <Table.HeaderCell>Lote</Table.HeaderCell>
                    <Table.HeaderCell>F. Vencimiento</Table.HeaderCell>
                    <Table.HeaderCell textAlign="center">Progreso</Table.HeaderCell>
                    <Table.HeaderCell textAlign="center">Estado</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {renglones.map((reng, i) => {
                    const scanned = scannedData[reng.reng_num] || 0;
                    const total = reng.total_art;
                    const isComplete = scanned >= total;

                    return (
                      <Table.Row
                        key={i}
                        ref={el => itemRefs.current[reng.reng_num] = el}
                        positive={isComplete}
                      >
                        <Table.Cell>{i + 1}</Table.Cell>
                        <Table.Cell>
                          <Header as='h5'>{reng.co_art}</Header>
                          <p style={{ fontSize: '0.8em', color: '#6c757d' }}>Ref: {reng.ref || "N/A"}</p>
                        </Table.Cell>
                        <Table.Cell>{reng.co_color}</Table.Cell>
                        <Table.Cell>{reng.nro_lote}</Table.Cell>
                        <Table.Cell>{reng.fec_lote}</Table.Cell>
                        <Table.Cell textAlign="center">
                          <strong>{scanned} / {total}</strong>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          {isComplete ? (
                            <Icon name="checkmark" color="green" size="large" />
                          ) : (
                            <span style={{ color: '#6c757d', fontSize: '0.9em' }}>Pendiente</span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </Segment>
          </Grid.Column>
        )}
      </Grid>

      {/* Modal para el escáner */}
      <Modal open={showScanner} onClose={() => setShowScanner(false)} size="small">
        <Modal.Header>Escáner de Código de Barras</Modal.Header>
        <Modal.Content>
          <Scanner
            onResult={(e)=>console.log(e)}
            onError={handleError}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setShowScanner(false)}>Cerrar</Button>
        </Modal.Actions>
      </Modal>

      {/* Estilo para el resaltado de filas */}
      <style jsx global>{`
        .highlight-row {
          background-color: #fffbeb !important;
          transition: background-color 0.3s ease;
        }
      `}</style>
    </div>
  );
}
