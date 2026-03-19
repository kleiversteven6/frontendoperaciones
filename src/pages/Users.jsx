import { useState, useEffect } from "react";
import { getUsers, updateUser, deleteUser, register } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Label, Modal, Segment, Table } from "semantic-ui-react";
import { toast } from "react-toastify";

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // Estado formulario edición
    const [editRole, setEditRole] = useState("user");
    const [editPassword, setEditPassword] = useState("");
    const [username, setUsername] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            console.log(data);
            
            setUsers(data);
        } catch (err) {
            setError("Error al cargar usuarios");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;
        try {
            await deleteUser(id);
            setUsers(users.filter((user) => user.id !== id));
        } catch (err) {
            alert("Error al eliminar usuario");
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditRole(user.role);
        setEditPassword(""); // Limpiar password al abrir
        setIsModalOpen(true);
    };
    const createUser = () => {
        setEditingUser({
            username: "",
            password: "",
            role: "user"

        });
        setEditRole("user");
        setEditPassword(""); // Limpiar password al abrir
        setIsModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const data = { role: editRole, name: username };
            if (editPassword) data.password = editPassword;

            await updateUser(editingUser.id, data);

            // Actualizar lista local
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: editRole } : u));

            setIsModalOpen(false);
            setEditingUser(null);
        } catch (err) {
            alert("Error al actualizar usuario");
        }
    };

    const handleSubmitCreate = async () => {
     const token = localStorage.getItem("token");
        try {
            await register(username, editPassword, editRole,token);
            toast.success("Usuario registrado exitosamente");
            fetchUsers();
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (err) {
            setError(err.response?.data?.message || "Error al registrar usuario");
        }
    };
    if (loading) return <div className="p-10 text-center">Cargando usuarios...</div>;

    return (
        <Segment style={{ minHeight: '100vh' }}>
            <Container>
                {error && <div className="mb-4 text-red-600">{error}</div>}
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell colSpan={5} textAlign="right"> <Button color="green" content="Agregar" basic onClick={() => createUser()} /> </Table.HeaderCell>
                        </Table.Row>
                        <Table.Row>
                            <Table.HeaderCell>ID</Table.HeaderCell>
                            <Table.HeaderCell>Usuario</Table.HeaderCell>
                            <Table.HeaderCell>Rol</Table.HeaderCell>
                            <Table.HeaderCell>Creado</Table.HeaderCell>
                            <Table.HeaderCell>Acciones</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {users.map((user) =>
                            <Table.Row>

                                <Table.Cell>{user.id}</Table.Cell>
                                <Table.Cell>{user.username}</Table.Cell>
                                <Table.Cell>
                                    <Label basic color={user.role === 'admin' ? "green" : "teal"} >
                                        {user.role}
                                    </Label>
                                </Table.Cell>
                                <Table.Cell>{new Date(user.created_at).toLocaleDateString()}</Table.Cell>
                                <Table.Cell> <Button
                                    icon="pencil"
                                    color="blue"
                                    basic
                                    onClick={() => handleEditClick(user)}
                                />
                               {/* {     <Button
                                        icon="trash"
                                        color="red"
                                        basic
                                        onClick={() => handleDelete(user.id)}
                                    />} */}
                                </Table.Cell>
                            </Table.Row>)}
                    </Table.Body>
                </Table>


                {/* Modal de Edición */}
                {isModalOpen && (
                    <Modal size="mini" open={isModalOpen} onClose={() => setIsModalOpen(false)} closeIcon >

                        <Modal.Header>{editingUser.id ? `Editar usuario:${editingUser.username}` : "Crear nuevo usuario"}</Modal.Header>

                        <Modal.Content>
                            <Form onSubmit={handleUpdate} >
                                <Form.Group >

                                    <Form.Select
                                        fluid
                                        width={16}
                                        label="Rol"
                                        defaultValue={editRole}
                                        onChange={(e, { value }) => setEditRole(value)}
                                        options={[{ text: "Usuario", value: "user" }, { text: "Administrador", value: "admin" }]}
                                    />
                                </Form.Group>
                                {
                                    !editingUser.id &&
                                    <Form.Group >
                                        <Form.Input
                                            fluid
                                            width={16}
                                            label="Nombre de usuario"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder=""

                                        />
                                    </Form.Group>}
                                <Form.Group >
                                    <Form.Input
                                        fluid
                                        width={16}
                                        label="Contraseña"
                                        type="password"
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        placeholder="Dejar en blanco para no cambiar"

                                    />
                                </Form.Group>
                            </Form>


                        </Modal.Content>
                        <Modal.Actions>
                            <Button color="red" onClick={() => setIsModalOpen(false)} >Cancelar</Button>
                            {editingUser.id ?
                                <Button color="green" onClick={handleUpdate}>Guardar</Button>
                                : <Button color="green" onClick={handleSubmitCreate}>Guardar</Button>
                            }
                        </Modal.Actions>
                    </Modal>

                )}
            </Container>
        </Segment>
    );
}
