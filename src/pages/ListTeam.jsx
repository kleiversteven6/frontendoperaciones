import React, { useCallback, useEffect, useMemo, useState } from "react";
import { filtrosZonasSegmentos, pedidosDespachar, removedespachar, rnotasFactRecientes } from "../context/globalvars";
import { Form, Label, Input, Message, Segment, Table, Button, Checkbox } from "semantic-ui-react";
import Paginador from "../components/Paginador";
import PreLoader from "../components/preloader";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

// Constantes y colores
const PAGE_SIZE = 15;
const statusColors = { anulada: "#ffeaea", impresa: "#e6f7ee", pendiente: "#fffbe6", default: "#f8fafc" };
const processColors = {
  Preparacion: "#e3f2fd", Chequeo: "#f3e5f5", Embalaje: "#e8f5e9", Pendiente: "#fff8e1",
  Preparado: "#bbdefb", Chequeado: "#d1c4e9", Embalado: "#c8e6c9", Despachado: "#1fe277ff"
};

export default function ListTeam() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [segmentos, setSegmentos] = useState([]);
  const [listaZonas, setListaZonas] = useState([]);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [selectedZones, setSelectedZones] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Efecto para establecer fechas por defecto (último mes)
  useEffect(() => {
    const today = new Date();
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const formatDate = (date) => date.toISOString().split('T')[0];
    setFechaDesde(formatDate(firstDayOfLastMonth));
    setFechaHasta(formatDate(lastDayOfLastMonth));
  }, []);

  // Fetch de zonas y segmentos
  const fetchZonasYSegmentos = useCallback(async () => {
    try {
      const res = await fetch(filtrosZonasSegmentos, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      setSegmentos(data.segmentos.map(lab => ({ key: lab.co_seg, value: lab.co_seg, text: lab.seg_des })));
      setListaZonas(data.zonas.map(lab => ({ key: lab.co_zon, value: lab.co_zon, text: lab.zon_des })));
    } catch (err) {
      console.error("Error al cargar zonas/segmentos:", err);
    }
  }, []);

  const fetchFacturas = useCallback(async (isBackground = false, searchTerm = terminoBusqueda) => {
    if (!isBackground) setLoading(true);

    const token = localStorage.getItem("token");
    const jsonData = {
      search: searchTerm, // Usa el término de búsqueda pasado como argumento
      status: [0, 1, 2],
      desde: fechaDesde,
      hasta: fechaHasta,
    };
console.log(jsonData);

    try {
      const res = await fetch(rnotasFactRecientes, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(jsonData),
      });
      const data = await res.json();
      console.log(data);
      
      setFacturas(data.filter((f) => f.estatus === "Embalado" || f.estatus === "Despachado"));
    } catch (err) {
      console.error("Error al cargar facturas:", err);
      if (!isBackground) setFacturas([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [fechaDesde, fechaHasta]); // Dependencias necesarias



  // Efectos
  useEffect(() => { fetchZonasYSegmentos(); }, [fetchZonasYSegmentos]);
  useEffect(() => {
    fetchFacturas();
    const interval = setInterval(() => fetchFacturas(true), 30000);
    return () => clearInterval(interval);
  }, []); // **Solo se ejecuta al montar el componente**



  // Filtrado de facturas
  const filteredFacturas = useMemo(() => {
    return facturas.filter(f => {
      const matchesSegment = selectedSegments.length === 0 || selectedSegments.includes(f.co_seg);
      const matchesZone = selectedZones.length === 0 || selectedZones.includes(f.co_zon);
      let matchesStatus = true;

      if (selectedStatus === '2') {
        matchesStatus = f.status == 2;
      } else if (selectedStatus) {
        matchesStatus = f.estatus === selectedStatus;
      }

      return matchesSegment && matchesZone && matchesStatus;
    });
  }, [facturas, selectedSegments, selectedZones, selectedStatus]);

  // Paginación
  const paginatedFacturas = useMemo(() => {
    return filteredFacturas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredFacturas, page]);
  const totalPages = Math.ceil(filteredFacturas.length / PAGE_SIZE);

  // Funciones auxiliares
  const getStatusBadgeStyle = (status) => {
    const bg = processColors[status] || "#f5f5f5";
    const color = status === "Pendiente" ? "#f57c00" : "#222";
    return { background: bg, color };
  };

  const getRowColor = (factura) => {
    if (factura.anulada) return statusColors.anulada;
    if (factura.impresa) return statusColors.impresa;
    return statusColors.default;
  };

  const getElapsedTime = (startDate) => {
    if (!startDate) return "-";
    try {
      const start = new Date(startDate);
      const now = new Date();
      const diff = now - start;
      if (diff < 0) return "0m";
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
    } catch (e) { return "-"; }
  };

  const removeDuplicates = (cadena) => {
    if (typeof cadena !== "string" || cadena.trim() === "") return cadena || "";
    const arr = cadena.split(",");
    return [...new Set(arr)].join(",");
  };

  // Exportar a Excel
  const exportToExcel = () => {
    const grouped = filteredFacturas.filter(f => f.estatus !== 'Despachado').reduce((acc, factura) => {
      const clienteKey = `${factura.co_cli} - ${factura.cli_des}`;
      if (!acc[clienteKey]) {
        acc[clienteKey] = {
          pedidos: [],
          facturas: [],
          totalBultos: 0,
          segmento: factura.seg_des,
          zona: factura.zon_des,
          direc: factura.direc1,
          entr: factura.dir_ent2
        };
      }
      acc[clienteKey].pedidos.push(factura.fact_num);
      if (factura.status == 2) acc[clienteKey].facturas.push(removeDuplicates(factura.facturas));
      acc[clienteKey].totalBultos += parseInt(factura.nro_bultos) || 0;
      return acc;
    }, {});

    const excelData = Object.entries(grouped).map(([cliente, datos]) => ({
      Zona: datos.zona,
      Cliente: cliente,
      Direccion_Fiscal: datos.direc,
      Direccion_Entrega: datos.entr,
      Total_Pedidos: datos.pedidos.length,
      Pedidos: datos.pedidos.join(", "),
      Facturas: datos.facturas.join(", "),
      Total_Bultos: datos.totalBultos
    }));

    const headers = [["Fecha de salida:", ""], ["Zona:", "", "Conductores:", "", "", "Vehículo:", "", "Placa:", ""]];
    const columnNames = [["Zona", "Cliente", "Dirección Fiscal", "Dirección Entrega", "Total Pedidos", "Pedidos", "Facturas", "Total Bultos"]];
    const fullData = [...headers, [], ...columnNames, ...excelData.map(item => Object.values(item))];

    const worksheet = XLSX.utils.aoa_to_sheet(fullData);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
      { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Documentos por Cliente");
    XLSX.writeFile(workbook, "DocumentosPorCliente.xlsx");
  };

  // Manejo de teclas
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        fetchFacturas(false, terminoBusqueda); // Pasa el término de búsqueda actual
      }
    },
    [terminoBusqueda, fetchFacturas]
  );


  // Manejo de checkbox
  const handleDocCheck = (doc, checked) => {
    setSelectedDocs(checked ? [...selectedDocs, doc] : selectedDocs.filter(f => f !== doc));
  };

  // Paginación
  const paginate = useCallback((npage) => setPage(npage), []);

  // Enviar documentos seleccionados
  const checkListDocs = async () => {
    if (selectedDocs.length === 0) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(pedidosDespachar, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ pedidos: selectedDocs }),
      });
      await res.json();
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Documentos enviados correctamente.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error al enviar documentos:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron enviar los documentos.",
        confirmButtonColor: "#d33"
      });
    } finally {
      setLoading(false);
      setSelectedDocs([]);
    }
  };

  const eliminarLog = async (factura) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      html: `Esto eliminará el registro de <b>${factura.estatus}</b>.`,
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
      const res = await fetch(removedespachar, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ pedido: factura.fact_num }),
      });
      if (!res.ok) throw new Error("Error al eliminar log");

      Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "El registro fue eliminado exitosamente.",
        timer: 1500,
        showConfirmButton: false
      });
      fetchFacturas();
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

  // Render
  return (
    <div style={{ padding: "2rem", background: "#f4f6fb", minHeight: "100vh" }}>
      <h2 style={{ color: "#222", marginBottom: "2rem", textAlign: "center", fontWeight: "bold", letterSpacing: "1px" }}>
        Monitor de Pedidos Embalaje
      </h2>
      <div style={{ borderRadius: "12px", boxShadow: "0 2px 12px #e0e0e0", background: "#fff" }}>
        {loading ? <PreLoader /> : (
          <>
            <Segment>
              <Table compact size="small">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell colSpan={8}>
                      <Form>
                        <Form.Group>
                          <Form.Field>
                            <label>Desde:</label>
                            <Input
                              type="date"
                              value={fechaDesde}
                              onChange={(e) => setFechaDesde(e.target.value)}
                            />
                          </Form.Field>
                          <Form.Field>
                            <label>Hasta:</label>
                            <Input
                              type="date"
                              value={fechaHasta}
                              onChange={(e) => setFechaHasta(e.target.value)}
                            />
                          </Form.Field>
                          <Button
                            size="small"
                            color="blue"
                            onClick={fetchFacturas}
                          >
                            Consultar
                          </Button>
                        </Form.Group>
                        <Form.Group>
                          <Form.Input
                            label="Filtrar"
                            width={3}
                            icon="search"
                            onKeyDown={handleKeyDown}
                            onChange={(e) => setTerminoBusqueda(e.target.value)}
                            value={terminoBusqueda}
                          />
                          <Form.Select
                            width={3}
                            label="Filtrar por segmento"
                            options={segmentos}
                            search
                            multiple
                            onChange={(e, { value }) => setSelectedSegments(value)}
                          />
                          <Form.Select
                            width={3}
                            label="Filtrar por zona"
                            options={listaZonas}
                            search
                            multiple
                            onChange={(e, { value }) => setSelectedZones(value)}
                          />
                        </Form.Group>
                        <Button.Group>
                          <Button toggle active={selectedStatus === ''} onClick={() => setSelectedStatus('')}>Todos</Button>
                          <Button toggle active={selectedStatus === 'Despachado'} onClick={() => setSelectedStatus('Despachado')}>Despachado</Button>
                          <Button toggle active={selectedStatus === 'Embalado'} onClick={() => setSelectedStatus('Embalado')}>Embalado</Button>
                          <Button toggle active={selectedStatus === '2'} onClick={() => setSelectedStatus('2')}>Facturado</Button>
                        </Button.Group>
                      </Form>
                      <Button basic color="green" icon="file excel" floated="right" onClick={exportToExcel} />
                    </Table.HeaderCell>
                  </Table.Row>
                  <Table.Row>
                    <Table.HeaderCell>Pedido</Table.HeaderCell>
                    <Table.HeaderCell>Fecha</Table.HeaderCell>
                    <Table.HeaderCell width={3}>Cliente</Table.HeaderCell>
                    <Table.HeaderCell>Segmento</Table.HeaderCell>
                    <Table.HeaderCell>Zona</Table.HeaderCell>
                    <Table.HeaderCell>Bultos</Table.HeaderCell>
                    <Table.HeaderCell>Estatus</Table.HeaderCell>
                    <Table.HeaderCell>Acciones</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {facturas.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={8}><Message warning>No se encontraron facturas.</Message></Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedFacturas.map((factura) => (
                      <Table.Row
                        key={factura.fact_num}
                        style={{
                          background: getRowColor(factura),
                          color: factura.anulada ? "#d32f2f" : "#222",
                          fontWeight: factura.anulada ? "bold" : "normal",
                          borderBottom: "1px solid #e0e0e0",
                        }}
                      >
                        <Table.Cell>
                          <Checkbox
                            checked={selectedDocs.includes(factura.fact_num)}
                            onChange={(e, { checked }) => handleDocCheck(factura.fact_num, checked)}
                          />
                          {factura.fact_num}
                        </Table.Cell>
                        <Table.Cell>{factura.fec_emis?.slice(0, 10)}</Table.Cell>
                        <Table.Cell>{factura.co_cli} - {factura.cli_des}</Table.Cell>
                        <Table.Cell width={2}><Label color="black" basic>{factura.seg_des}</Label></Table.Cell>
                        <Table.Cell width={2}><Label color="black" basic>{factura.zon_des}</Label></Table.Cell>
                        <Table.Cell><Label basic color={factura.nro_bultos ? "teal" : "grey"}>{factura.nro_bultos ?? "-"}</Label></Table.Cell>
                        <Table.Cell>
                          {factura.status == 2 && <Label color="orange" basic>F</Label>}
                          <Label style={getStatusBadgeStyle(factura.estatus)}>{factura.estatus ?? "-"}</Label>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="mini"
                            color="red"
                            icon="trash"
                            onClick={() => eliminarLog(factura)}
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
                <Table.Footer>
                  <Table.Row>
                    <Table.Cell colSpan={8} textAlign="right">
                      <Paginador paginate={paginate} page={page} lastPage={totalPages} />
                    </Table.Cell>
                  </Table.Row>
                </Table.Footer>
              </Table>
              <Button
                primary
                disabled={selectedDocs.length === 0}
                onClick={checkListDocs}
                style={{ marginTop: "1rem" }}
              >
                Enviar {selectedDocs.length > 0 ? `(${selectedDocs.length})` : ""}
              </Button>
            </Segment>
          </>
        )}
      </div>
      <Message color="blue" style={{ textAlign: "center" }}>
        Última actualización: {new Date().toLocaleTimeString()}
      </Message>
    </div>
  );
}
