import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
// Importaciones de Semantic UI más completas
import { 
  Input, 
  Button, 
  Loader, 
  Modal, 
  Form, 
  Table, 
  Header, 
  Segment, 
  Icon, 
  Grid, 
  Divider, 
  Checkbox,
  Card,
  List
} from "semantic-ui-react";
import { 
  pedidosAdd, 
  pedidosArticulos, 
  pedidosConfirmar, 
  pedidosFacturas, 
  pedidosRelease, 
  pedidosRemove, 
  pedidosUpdate 
} from "../context/globalvars";

export default function Preparacion() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [workerNumber, setWorkerNumber] = useState("");
  const [cesta, setCesta] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [newQuantity, setNewQuantity] = useState("1");
  const [isSearching, setIsSearching] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  // --- Lógica de Funciones (Se mantiene idéntica a la original) ---
  const buscarPedido = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: "error", title: "Acceso Denegado", text: "No estás autenticado.", confirmButtonColor: "#d33" });
      return;
    }
    try {
      const res = await fetch(pedidosFacturas, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ fact_num: codigo, processType: "Preparacion" })
      });
      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          const { user, area, since } = errorData.details || {};
          Swal.fire({ icon: "warning", title: "Pedido Bloqueado", html: `Usuario: <b>${user || 'otro'}</b><br>Área: <b>${area}</b>`, confirmButtonColor: "#f59e0b" });
        } else {
          Swal.fire({ icon: "error", title: "Error", text: errorData.message || "Error al buscar", confirmButtonColor: "#d33" });
        }
        return;
      }
      const data = await res.json();
      if (data.renglones) {
        data.renglones.sort((a, b) => a.co_color.localeCompare(b.co_color, undefined, { numeric: true }));
      }
      setPedido(data);
      setCesta(data.cesta || "");
      setCheckedItems({});
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error de Conexión", text: "Fallo de red." });
    }
  };

  const handleSave = async () => {
    if (!pedido) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(pedidosUpdate, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ fact_num: pedido.fact_num, renglones: pedido.renglones })
      });
      setLoading(false);
      if (res.ok) {
        Swal.fire({ icon: "success", title: "Guardado", timer: 1500, showConfirmButton: false });
      }
    } catch (e) { setLoading(false); }
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
    } finally { setIsSearching(false); }
  };

  const handleAddProduct = async () => {
    const quantity = parseInt(newQuantity);
    if (!selectedArticle || quantity <= 0) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(pedidosAdd, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ fact_num: pedido.fact_num, co_art: selectedArticle.co_art, total_art: newQuantity })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setSelectedArticle(null);
        buscarPedido();
      }
    } catch (error) { Swal.fire("Error", "No se pudo agregar", "error"); }
  };

  const handleRemoveProduct = async (reng_num) => {
    const confirm = await Swal.fire({ title: "¿Eliminar?", icon: "warning", showCancelButton: true });
    if (!confirm.isConfirmed) return;
    const token = localStorage.getItem("token");
    await fetch(pedidosRemove, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ fact_num: pedido.fact_num, reng_num })
    });
    buscarPedido();
  };

  const enviarTrabajador = async () => {
    if (!workerNumber) return;
    const token = localStorage.getItem("token");
    const res = await fetch(pedidosConfirmar, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        fact_num: String(pedido.fact_num).trim(),
        processType: "Preparacion",
        workerNumber,
        cesta,
        renglones: pedido.renglones
      })
    });
    if (res.ok) {
      setPedido(null);
      setCodigo("");
      setWorkerNumber("");
      Swal.fire("Completado", "Confirmado con éxito", "success");
    }
  };

  const handleCancel = async () => {
    const token = localStorage.getItem("token");
    await fetch(pedidosRelease, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ fact_num: pedido.fact_num, processType: "Preparacion" })
    });
    setPedido(null);
    setCodigo("");
  };

  // --- Renderizado ---
  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px' }}>
      
      {/* Modal de Carga */}
      <Modal basic open={loading} size="small">
        <Loader size="huge" inverted content="Guardando cambios..." />
      </Modal>

      <Grid centered>
        <Grid.Row>
          <Grid.Column mobile={16} tablet={14} computer={12}>
            
            {/* Header Principal */}
            <Segment clearing raised color="blue">
              <Header as="h2" floated="left">
                <Icon name="boxes" />
                <Header.Content>
                  Área de Preparación
                  <Header.Subheader>Gestión y picking de pedidos</Header.Subheader>
                </Header.Content>
              </Header>
              <Header as="h4" floated="right" color="grey">
                {new Date().toLocaleDateString()}
              </Header>
            </Segment>

            {/* Barra de Búsqueda y Datos del Trabajador */}
            <Segment raised>
              <Form>
                <Grid verticalAlign="bottom">
                  <Grid.Column mobile={16} tablet={6} computer={5}>
                    <Form.Input
                      fluid
                      label="Código de Pedido"
                      placeholder="Ej. 12345"
                      action={
                        <Button color="blue" icon="search" onClick={buscarPedido} disabled={!codigo} />
                      }
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && buscarPedido()}
                    />
                  </Grid.Column>
                  
                  {pedido && (
                    <>
                      <Grid.Column mobile={8} tablet={5} computer={3}>
                        <Form.Input
                          fluid
                          label="N° Trabajador"
                          icon="user"
                          iconPosition="left"
                          placeholder="ID"
                          value={workerNumber}
                          onChange={(e) => setWorkerNumber(e.target.value)}
                        />
                      </Grid.Column>
                      <Grid.Column mobile={8} tablet={5} computer={3}>
                        <Form.Input
                          fluid
                          label="N° Cesta"
                          icon="shopping basket"
                          iconPosition="left"
                          placeholder="Cesta"
                          value={cesta}
                          onChange={(e) => setCesta(e.target.value)}
                        />
                      </Grid.Column>
                      <Grid.Column mobile={16} tablet={16} computer={5} textAlign="right">
                        <Button.Group fluid>
                          <Button color="red" onClick={handleCancel} icon="cancel" content="Anular" />
                          <Button.Or text="o" />
                          <Button color="green" onClick={handleSave} icon="save" content="Guardar" />
                        </Button.Group>
                      </Grid.Column>
                    </>
                  )}
                </Grid>
              </Form>
            </Segment>

            {/* Información del Pedido y Tabla */}
            {pedido && (
              <Segment raised>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <Header as="h3">
                    <Icon name="file alternate outline" />
                    Detalles: {pedido.co_cli}
                  </Header>
                  <Button 
                    color="olive" 
                    icon="plus" 
                    content="Añadir Producto" 
                    onClick={() => setIsModalOpen(true)} 
                  />
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <Table celled selectable striped compact>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell textAlign="center">✓</Table.HeaderCell>
                        <Table.HeaderCell>#</Table.HeaderCell>
                        <Table.HeaderCell>Artículo</Table.HeaderCell>
                        <Table.HeaderCell>Almacen</Table.HeaderCell>
                        <Table.HeaderCell>Ubicación</Table.HeaderCell>
                        <Table.HeaderCell>Lote</Table.HeaderCell>
                        <Table.HeaderCell>F. Venc</Table.HeaderCell>
                        <Table.HeaderCell>Cant.</Table.HeaderCell>
                        <Table.HeaderCell textAlign="center">Acción</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>

                    <Table.Body>
                      {pedido.renglones.map((reng, i) => {
                        const isChecked = checkedItems[reng.reng_num];
                        return (
                          <Table.Row key={i} positive={isChecked}>
                            <Table.Cell textAlign="center">
                              <Checkbox 
                                checked={!!isChecked} 
                                onChange={() => setCheckedItems(prev => ({...prev, [reng.reng_num]: !prev[reng.reng_num]}))}
                              />
                            </Table.Cell>
                            <Table.Cell>{i + 1}</Table.Cell>
                            <Table.Cell>
                              <strong>{reng.co_art_code}-{reng.co_art}</strong>
                              <div style={{ fontSize: '0.85em', color: 'gray' }}>{ reng.ref}</div>
                            </Table.Cell>
                            <Table.Cell>
                              <Header as="h4" color="blue">{reng.co_alma}</Header>
                            </Table.Cell>
                            <Table.Cell>
                              <Header as="h4" color="blue">{reng.co_color}</Header>
                            </Table.Cell>
                            <Table.Cell>
                              {reng.available_lots?.length > 0 ? (
                                <select 
                                  className="ui dropdown"
                                  value={reng.nro_lote}
                                  disabled={isChecked}
                                  onChange={(e) => {
                                    const selectedLotNum = e.target.value;
                                    const selectedLotData = reng.available_lots.find(l => l.nro_lote === selectedLotNum);
                                    const newRenglones = [...pedido.renglones];
                                    newRenglones[i].nro_lote = selectedLotNum;
                                    if (selectedLotData) newRenglones[i].fec_lote = selectedLotData.fec_lote;
                                    setPedido({ ...pedido, renglones: newRenglones });
                                  }}
                                >
                                  <option value={reng.nro_lote}>{reng.nro_lote}</option>
                                  {reng.available_lots.map(l => (
                                    <option key={l.nro_lote} value={l.nro_lote}>{l.nro_lote} (S:{l.stock_act})</option>
                                  ))}
                                </select>
                              ) : reng.nro_lote}
                            </Table.Cell>
                            <Table.Cell>{reng.fec_lote}</Table.Cell>
                            <Table.Cell>
                              <Input 
                                type="number" 
                                size="mini" 
                                style={{ width: '80px' }}
                                value={reng.total_art}
                                disabled={isChecked}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newRenglones = [...pedido.renglones];
                                  newRenglones[i].total_art = val;
                                  setPedido({ ...pedido, renglones: newRenglones });
                                }}
                              />
                            </Table.Cell>
                            <Table.Cell textAlign="center">
                              <Button 
                                icon="trash" 
                                circular 
                                color="red" 
                                size="mini" 
                                onClick={() => handleRemoveProduct(reng.reng_num)} 
                              />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>

                    <Table.Footer fullWidth>
                      <Table.Row>
                        <Table.HeaderCell colSpan="8">
                          <Button
                            floated="right"
                            icon="check"
                            labelPosition="left"
                            color="teal"
                            size="small"
                            content="Confirmar Finalización"
                            disabled={!workerNumber}
                            onClick={enviarTrabajador}
                          />
                        </Table.HeaderCell>
                      </Table.Row>
                    </Table.Footer>
                  </Table>
                </div>
              </Segment>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>

      {/* Modal para Agregar Producto Re-diseñado */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        size="tiny"
      >
        <Modal.Header>Buscar Producto</Modal.Header>
        <Modal.Content>
          {!selectedArticle ? (
            <>
              <Input
                fluid
                placeholder="Nombre o código..."
                action={{ 
                  color: 'blue', 
                  icon: 'search', 
                  loading: isSearching, 
                  onClick: handleSearchArticles 
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchArticles()}
              />
              <Divider />
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <List divided relaxed selection>
                  {searchResults.map(art => (
                    <List.Item key={art.co_art} onClick={() => setSelectedArticle(art)}>
                      <List.Content>
                        <List.Header>{art.art_des}</List.Header>
                        <List.Description>
                          ID: {art.co_art} | <strong>Stock: {art.stock_act}</strong>
                        </List.Description>
                      </List.Content>
                    </List.Item>
                  ))}
                </List>
              </div>
            </>
          ) : (
            <Card fluid color="blue">
              <Card.Content>
                <Card.Header>{selectedArticle.art_des}</Card.Header>
                <Card.Meta>Código: {selectedArticle.co_art}</Card.Meta>
                <Card.Description>
                  <Form>
                    <Form.Field>
                      <label>Cantidad a agregar (Stock: {selectedArticle.stock_act})</label>
                      <Input 
                        type="number" 
                        autoFocus
                        value={newQuantity} 
                        onChange={(e) => setNewQuantity(e.target.value)} 
                      />
                    </Form.Field>
                  </Form>
                </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <Button basic color="red" onClick={() => setSelectedArticle(null)}>Cambiar</Button>
              </Card.Content>
            </Card>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setIsModalOpen(false)}>Cancelar</Button>
          <Button color="green" disabled={!selectedArticle} onClick={handleAddProduct}>
            Confirmar e incluir
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
}