import React, { useCallback, useEffect, useMemo, useState } from "react";
import { rnotasFactRecientes } from "../context/globalvars";
import {
  Form,
  Label,
  Input,
  Message,
  Segment,
  Table,
} from "semantic-ui-react";
import Paginador from "../components/Paginador";
import PreLoader from "../components/preloader";
import { useLocation, useNavigate, useParams } from "react-router-dom";

// Colores mejorados y más suaves
const statusColors = {
  anulada: "#ffeaea",
  impresa: "#e6f7ee",
  pendiente: "#fffbe6",
  default: "#f8fafc",
};

const processColors = {
  Preparacion: "#e3f2fd",
  Chequeo: "#f3e5f5",
  Embalaje: "#e8f5e9",
  Pendiente: "#fff8e1",
  Preparado: "#bbdefb",
  Chequeado: "#d1c4e9",
  Embalado: "#c8e6c9",
};

function getStatusBadgeStyle(status) {
  const bg = processColors[status] || "#f5f5f5";
  const color = status === "Pendiente" ? "#f57c00" : "#222";
  return {
    background: bg,
    color: color,
  };
}

function getRowColor(factura) {
  if (factura.anulada) return statusColors.anulada;
  if (factura.impresa) return statusColors.impresa;
  return statusColors.default;
}

function getElapsedTime(startDate) {
  if (!startDate) return "-";
  try {
    const start = new Date(startDate);
    const now = new Date();
    const diff = now - start;
    if (diff < 0) return "0m";
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  } catch (e) { return "-"; }
}

const PAGE_SIZE = 15;

const FilterButton = ({ label, status, filterStatus, setFilterStatus, setPage }) => (
  <button
    onClick={() => { setFilterStatus(status); setPage(1); }}
    style={{
      padding: "0.5em 1em",
      borderRadius: "8px",
      border: "none",
      background: filterStatus === status ? "#004aad" : "#e0e0e0",
      color: filterStatus === status ? "#fff" : "#222",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.2s"
    }}
  >
    {label}
  </button>
);

export default function Monitor() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [facturaEncontrada, setFacturaEncontrada] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [page, setPage] = useState(1);
  const [load, setLoad] = useState(false);
  const { buscar = '' } = useParams();
  const [listDocs, setListDocs] = useState([]);

  const [terminoBusqueda, setTerminoBusqueda] = useState(buscar);
  const location = useLocation();
  const fetchFacturas = useCallback(async (isBackground = false) => {
    const token = localStorage.getItem("token");
    if (!isBackground) setLoading(true);
    const jsonData = { search: terminoBusqueda };
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(jsonData),
    };
    try {
      const res = await fetch(rnotasFactRecientes, requestOptions);
      const data = await res.json();

      if (data.error) {

      } else {
        setFacturas(data);
        setLoad(false);
      }

    } catch (err) {
      console.error("Error al cargar facturas:", err);
      if (!isBackground) setFacturas([]);
    }
    if (!isBackground) setLoading(false);
  }, [location]);

  useEffect(() => {
    fetchFacturas();
    const interval = setInterval(() => fetchFacturas(true), 3000);
    return () => clearInterval(interval);
  }, [fetchFacturas]);

  useEffect(() => {
    if (busqueda.trim() === "") {
      setFacturaEncontrada(null);
      return;
    }
    const encontrada = facturas.find(
      (f) => String(f.fact_num) === busqueda.trim()
    );
    setFacturaEncontrada(encontrada || null);
  }, [busqueda, facturas]);

  const filteredFacturas = useMemo(() => {
    if (!facturas.error) {
      console.log("filter", facturas);

      return facturas.filter(f => {
        if (filterStatus === "Todos") return true;
        if (filterStatus === "Pendiente") {
          return ["Pendiente", "Preparado", "Chequeado"].includes(f.estatus);
        }
        return f.estatus === filterStatus;
      });
    }
  }, [facturas, filterStatus]);

  const paginatedFacturas = useMemo(() => {
    return filteredFacturas.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    );
  }, [filteredFacturas, page]);

  const totalPages = Math.ceil(filteredFacturas.length / PAGE_SIZE);
  const totalNotas = filteredFacturas.length;

  const paginate = useCallback((npage) => {
    setPage(npage);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      setLoad(true);
      navigate(`/monitor/${terminoBusqueda}`);
    }
  }, [navigate, terminoBusqueda]);
  const checkDocs = (doc, checked) => {
    console.log(listDocs);

    if (checked) {
      setListDocs([...listDocs, doc]);
    } else {
      setListDocs(listDocs.filter((f) => f != doc));
    }

  }
  return (
    <div style={{ padding: "2rem", background: "#f4f6fb", minHeight: "100vh", position: "relative" }}>
      {/* Input en la esquina superior derecha 
      <div style={{ position: "absolute", top: "2rem", right: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Buscar factura/nota..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          disabled={loading}
          style={{
            padding: "0.5em 1em",
            borderRadius: "8px",
            border: "1px solid #bdbdbd",
            fontSize: "1rem",
            outline: "none",
            background: "#fff",
            color: "#222",
            boxShadow: "0 2px 8px #e3e3e340",
          }}
        />
        {facturaEncontrada && (
          <span style={{ background: getRowColor(facturaEncontrada), color: "#222", borderRadius: "8px", padding: "0.5em 1em", fontWeight: "bold", boxShadow: "0 2px 8px #bdbdbd20", border: "1px solid #bdbdbd" }}>
            Factura encontrada: {facturaEncontrada.fact_num}
          </span>
        )}
        {busqueda && !facturaEncontrada && !loading && (
          <span style={{ background: "#ffeaea", color: "#d32f2f", borderRadius: "8px", padding: "0.5em 1em", fontWeight: "bold", boxShadow: "0 2px 8px #bdbdbd20", border: "1px solid #bdbdbd" }}>
            No encontrada
          </span>
        )}
      </div>
*/}
      {/* Contenedor resumen de total de notas - CENTRADO ARRIBA */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem", marginTop: "1rem" }}>
        <div style={{ background: "linear-gradient(90deg, #42a5f5 60%, #7e57c2 100%)", color: "#fff", borderRadius: "16px", padding: "1.2rem 2.2rem", fontWeight: "bold", fontSize: "1.5rem", boxShadow: "0 2px 12px #e0e0e0", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "180px" }}>
          <span style={{ fontSize: "2.2rem", fontWeight: "bold", letterSpacing: "1px" }}>{totalNotas}</span>
          <span style={{ fontSize: "1rem", fontWeight: "normal", marginTop: "0.2rem", letterSpacing: "0.5px" }}>Notas Totales</span>
        </div>
      </div>

      <h2 style={{ color: "#222", marginBottom: "2rem", textAlign: "center", fontWeight: "bold", letterSpacing: "1px" }}>
        Monitor de Facturas Recientes
      </h2>

      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <FilterButton label="Todos" status="Todos" filterStatus={filterStatus} setFilterStatus={setFilterStatus} setPage={setPage} />
        <FilterButton label="Preparación" status="Preparacion" filterStatus={filterStatus} setFilterStatus={setFilterStatus} setPage={setPage} />
        <FilterButton label="Chequeo" status="Chequeo" filterStatus={filterStatus} setFilterStatus={setFilterStatus} setPage={setPage} />
        <FilterButton label="Embalaje" status="Embalaje" filterStatus={filterStatus} setFilterStatus={setFilterStatus} setPage={setPage} />
        <FilterButton label="Pendientes" status="Pendiente" filterStatus={filterStatus} setFilterStatus={setFilterStatus} setPage={setPage} />
      </div>

      <div style={{ borderRadius: "12px", boxShadow: "0 2px 12px #e0e0e0", background: "#fff" }}>
        {loading ? (
          <PreLoader />
        ) : (
          <>
            <Segment>
              <Table compact >
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell colSpan={10}>
                      <Form>
                        <Form.Input
                          width={4}
                          icon="search"
                          loading={load}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setTerminoBusqueda(e.target.value)}
                          value={terminoBusqueda}
                        />
                      </Form>
                    </Table.HeaderCell>
                  </Table.Row>
                  <Table.Row>
                    <Table.HeaderCell>Pedido</Table.HeaderCell>
                    <Table.HeaderCell>Fecha</Table.HeaderCell>
                    <Table.HeaderCell>Cliente</Table.HeaderCell>
                    <Table.HeaderCell>Monto</Table.HeaderCell>
                    <Table.HeaderCell>Segmento</Table.HeaderCell>
                    <Table.HeaderCell>Bultos</Table.HeaderCell>
                    <Table.HeaderCell>Estatus</Table.HeaderCell>
                    <Table.HeaderCell>Usuario</Table.HeaderCell>
                    <Table.HeaderCell>Tiempo</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>


                  {

                    facturas.length === 0 ?
                      <Table.Row>
                        <Table.Cell colSpan={11}>
                          <Message warning>No se encontraron facturas.</Message>
                        </Table.Cell>
                      </Table.Row>
                      :
                      paginatedFacturas.map((factura) => (
                        <Table.Row
                          key={factura.fact_num}
                          style={{
                            background: getRowColor(factura),
                            color: factura.anulada ? "#d32f2f" : "#222",
                            fontWeight: factura.anulada ? "bold" : "normal",
                            borderBottom: "1px solid #e0e0e0",
                            transition: "background 0.2s",
                          }}
                        >
                          <Table.Cell style={{ fontSize: "16px", fontWeight: "bolder" }} textAlign="center">

                            {factura.campo2.trim() != '' && <Label color="red"  basic size="large">{factura.campo2.trim()}</Label>}
                            <div>{factura.fact_num}</div>
                          </Table.Cell>
                          <Table.Cell style={{ fontSize: "16px", fontWeight: "bolder" }} >{factura.fec_emis?.slice(0, 10)}</Table.Cell>
                          <Table.Cell width={6} style={{ fontSize: "16px", fontWeight: "bolder" }} >
                            {factura.co_cli} - {factura.cli_des}
                          </Table.Cell>
                          <Table.Cell>
                            <Label color="orange" basic size="large" > {Number(factura?.tot_bruto / (factura?.tasa || 1)).toLocaleString('es-VE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}</Label>
                          </Table.Cell>
                          <Table.Cell>
                            <Label color="grey" basic size="big" > {factura.seg_des}</Label>
                          </Table.Cell>
                          <Table.Cell><Label size="big" basic color={factura.nro_bultos ? "teal" : "grey"}>{factura.nro_bultos ?? "-"}</Label></Table.Cell>
                          <Table.Cell>
                            <Label size="big" style={getStatusBadgeStyle(factura.estatus)}>{factura.estatus ?? "-"}</Label>

                          </Table.Cell>
                          <Table.Cell>{factura.usuario || "-"}</Table.Cell>
                          <Table.Cell>{getElapsedTime(factura.tiempo_inicio)}</Table.Cell>

                        </Table.Row>
                      ))}
                </Table.Body>
                <Table.Footer>
                  <Table.Row>
                    <Table.Cell colSpan={10} textAlign="right">
                      <Paginador paginate={paginate} page={page} lastPage={totalPages} />
                    </Table.Cell>
                  </Table.Row>
                </Table.Footer>
              </Table>
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
