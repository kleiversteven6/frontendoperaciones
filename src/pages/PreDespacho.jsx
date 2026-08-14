import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Card, Segment, Button, Icon, List, Header, Divider, Input, Label } from "semantic-ui-react";
import { filtrosZonasSegmentos, pedidosembalaje } from '../context/globalvars';

export default function PreDespacho() {
    const [segmentos, setSegmentos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [viewMode, setViewMode] = useState('board');
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(false);

    // Cargar zonas y segmentos
    const fetchZonasYSegmentos = useCallback(async () => {
        try {
            const res = await fetch(filtrosZonasSegmentos, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            setSegmentos(data.segmentos);
        } catch (err) {
            console.error("Error al cargar zonas y segmentos:", err);
        }
    }, []);

    // Cargar pedidos
    const fetchPedidos = useCallback(async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(pedidosembalaje, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            const data = await res.json();
            console.log(data);
            
            setPedidos(data);
        } catch (err) {
            console.error("Error al cargar pedidos:", err);
        }
    }, []);

    useEffect(() => {
        fetchPedidos();
        fetchZonasYSegmentos();
    }, [fetchPedidos, fetchZonasYSegmentos]);

    // Asociar pedidos a segmentos
    const segmentosConPedidos = useMemo(() => {
        return segmentos.map(seg => {
            const pedidosFiltrados = pedidos.filter(pedido => pedido.co_seg === seg.co_seg);
            return {
                ...seg,
                pedidos: pedidosFiltrados
            };
        });
    }, [segmentos, pedidos]);

    // Lógica de filtrado y ordenamiento
    const segmentosProcesados = useMemo(() => {
        let resultado = [...segmentosConPedidos];

        // Filtrar por nombre de segmento
        if (searchTerm) {
            resultado = resultado.filter(s =>
                s.seg_des.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Ordenar por cantidad de pedidos
        resultado.sort((a, b) => {
            return sortAsc
                ? a.pedidos.length - b.pedidos.length
                : b.pedidos.length - a.pedidos.length;
        });

        return resultado;
    }, [segmentosConPedidos, searchTerm, sortAsc]);

    return (
        <Segment basic style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            {/* BARRA DE HERRAMIENTAS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Header as='h2' style={{ margin: 0 }}>Pre-Despacho</Header>
                    <Input
                        icon='search'
                        placeholder='Buscar segmento...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ minWidth: '250px' }}
                    />
                    <Button
                        icon
                        labelPosition='left'
                        onClick={() => setSortAsc(!sortAsc)}
                        color={sortAsc ? 'teal' : 'blue'}
                    >
                        <Icon name={sortAsc ? 'sort amount up' : 'sort amount down'} />
                        {sortAsc ? 'Menos pedidos' : 'Más pedidos'}
                    </Button>
                </div>

                <Button.Group size='small'>
                    <Button icon active={viewMode === 'board'} onClick={() => setViewMode('board')}>
                        <Icon name='columns' />
                    </Button>
                    <Button icon active={viewMode === 'list'} onClick={() => setViewMode('list')}>
                        <Icon name='list' />
                    </Button>
                </Button.Group>
            </div>

            <Divider />

            {/* CONTENEDOR DE DATOS */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {viewMode === 'board' ? (
                    <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '15px', gap: '1rem', height: '100%' }}>
                        {segmentosProcesados.map((seg) => (
                            <div key={seg.co_seg} style={{ minWidth: '300px' }}>
                                <Segment raised style={{ backgroundColor: '#f4f5f7', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <Header as='h4' style={{ margin: 0 }}>{seg.seg_des}</Header>
                                        <Label circular color='grey'>{seg.pedidos.length}</Label>
                                    </div>

                                    <Card.Group stackable itemsPerRow={1}>
                                        {seg.pedidos.length > 0 ? seg.pedidos.map((pedido) => (
                                            <Card key={pedido.fact_num} fluid className="trello-card">
                                                <Card.Content>
                                                    <Card.Header style={{ fontSize: '13px' }}>ORD-{pedido.fact_num}</Card.Header>
                                                    <Card.Meta>Cliente: {pedido.cli_des}</Card.Meta>
                                                    <Card.Description>
                                                        <strong>Fecha:</strong> {new Date(pedido.fec_emis).toLocaleDateString()}<br />
                                                        <strong>Dirección:</strong> {pedido.direc1}
                                                    </Card.Description>
                                                </Card.Content>
                                            </Card>
                                        )) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#99' }}>Sin pedidos</div>
                                        )}
                                    </Card.Group>
                                </Segment>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Segment raised>
                        <List divided relaxed>
                            {segmentosProcesados.map((seg) => (
                                <List.Item key={seg.co_seg} style={{ padding: '12px' }}>
                                    <List.Content floated='right'>
                                        <Label color='blue'>{seg.pedidos.length} Pedidos</Label>
                                    </List.Content>
                                    <Icon name='shipping fast' size='large' verticalAlign='middle' />
                                    <List.Content>
                                        <List.Header>{seg.seg_des}</List.Header>
                                        <List.Description>ID: {seg.co_seg}</List.Description>
                                    </List.Content>
                                </List.Item>
                            ))}
                        </List>
                    </Segment>
                )}
            </div>
        </Segment>
    );
}