import React, { useEffect, useState } from 'react';
import { listaguias, guiapdf } from '../context/globalvars';
import { Button, Container, Modal, Segment, Table, Embed } from 'semantic-ui-react';

export default function Guias() {
    const [lguias, setLguias] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [selectedGuiaId, setSelectedGuiaId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Token no encontrado");
            }

            const res = await fetch(listaguias, {
                method: "POST", // Cambiado a GET ya que solo estamos consultando
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });

            if (!res.ok) {
                throw new Error(`Error al cargar guías: ${res.statusText}`);
            }
            const data = await res.json();
            setLguias(data);
        } catch (err) {
            setError(err.message);
            console.error("Error al cargar guías:", err);
        } finally {
            setLoading(false);
        }
    };

    const verpdf = async (guiaId) => {
        try {
            setSelectedGuiaId(guiaId);
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Token no encontrado");
            }

            const res = await fetch(guiapdf, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ guia: guiaId })
            });

            if (!res.ok) {
                throw new Error(`Error al cargar PDF: ${res.statusText}`);
            }

            // Convertir la respuesta a un blob y crear una URL para el PDF
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            setOpen(true);
        } catch (err) {
            console.error("Error al cargar PDF:", err);
            //setError(`Error al cargar PDF: ${err.message}`);
        }
    };

    if (loading) {
        return <div>Cargando guías...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <Segment secondary basic style={{ height: '100vh' }}>
            <Modal size='fullscreen' open={open} onClose={() => {
                setOpen(false);
                window.URL.revokeObjectURL(pdfUrl); // Liberar la URL del objeto cuando se cierre el modal
            }}>
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
                    <Button color='red' onClick={() => {
                        setOpen(false);
                        window.URL.revokeObjectURL(pdfUrl);
                    }}>
                        Cerrar
                    </Button>
                </Modal.Actions>
            </Modal>
            <Container>
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Guía</Table.HeaderCell>
                            <Table.HeaderCell>Emisión</Table.HeaderCell>
                            <Table.HeaderCell>Usuario</Table.HeaderCell>
                            <Table.HeaderCell></Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {lguias.map((g) =>
                            <Table.Row key={g.id}>
                                <Table.Cell>{g.id}</Table.Cell>
                                <Table.Cell>{new Date(g.create_at).toLocaleString()}</Table.Cell>
                                <Table.Cell>{g.username}</Table.Cell>
                                <Table.Cell>
                                    <Button onClick={() => verpdf(g.id)} icon="file pdf" color='red' basic />
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </Container>
        </Segment>
    );
}
