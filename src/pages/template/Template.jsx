import React, { useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { Icon, Menu, Image, Segment, Sidebar, Button, Dropdown } from 'semantic-ui-react';
import App from "../../App";
import Preparacion from "../Preparacion";
import Chequeo from "../Chequeo";
import Embalaje from "../Embalaje";
import Monitor from "../Monitor";
import Users from "../Users";
import Admin from "../Admin";
import Dashboard from "../Dashboard";
import ProtectedRoute from "../../components/ProtectedRoute";
import logo from '../../assets/logo.jpg';
import ListTeam from '../ListTeam';
import Despacho from '../Despacho';
import Guias from '../Guias';
import { ToastContainer } from 'react-toastify';
import PreDespacho from '../PreDespacho';
import Empresa from '../Empresa';

export default function Template() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [activeItem, setActiveItem] = useState("Home");
    const [visible, setVisible] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    // --- CONFIGURACIÓN DEL MENÚ ---
    // Aquí puedes añadir futuras opciones fácilmente
    const menuConfig = [
        { name: 'Inicio', to: '/', role: '' },
        {
            name: 'Administrar',
            role: 'admin', // Solo visible para admin
            isDropdown: true,
            children: [
                { name: 'Usuarios', to: '/users' },
              //  { name: 'Empresa', to: '/empresa' }, // Nueva opción
                { name: 'Dashboard', to: '/dashboard' },
                { name: 'List Team', to: '/listteam' },
                { name: 'Admin General', to: '/admin' },
            ]
        },
        {
            name: 'Pedidos',
            role: '',
            isDropdown: true,
            children: [
                { name: 'Preparación', to: '/preparacion' },
                { name: 'Chequeo', to: '/chequeo' },
                { name: 'Embalaje', to: '/embalaje' },
            ]
        },
        { name: 'Monitor', to: '/monitor', role: '' },

        { name: 'Pre despacho', to: '/predespacho', role: '' },
        { name: 'Despacho', to: '/despacho', role: '' },
        { name: 'Guias', to: '/guias', role: '' }
    ];

    const handleItemClick = (name) => {
        setActiveItem(name);
        setVisible(false);
    };

    // Función para validar si el usuario tiene permiso
    const hasPermission = (item) => item.role === '' || item.role === user.role;

    return (
        <>
            <ToastContainer />

            {/* --- MENÚ DESKTOP --- */}
            <Menu style={{ marginBottom: 0 }} tabular className="desktop-menu">
                <Menu.Item>
                    <Image size='tiny' src={logo} />
                </Menu.Item>

                {menuConfig.map((item) => {
                    if (!hasPermission(item)) return null;

                    if (item.isDropdown) {
                        return (
                            <Dropdown
                                item
                                key={item.name}
                                text={item.name}
                                active={item.children.some(child => activeItem === child.name)}
                            >
                                <Dropdown.Menu>
                                    {item.children.map(child => (
                                        <Dropdown.Item
                                            key={child.name}
                                            as={NavLink}
                                            to={child.to}
                                            onClick={() => handleItemClick(child.name)}
                                            active={activeItem === child.name}
                                        >
                                            {child.name}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        );
                    }

                    return (
                        <Menu.Item
                            key={item.name}
                            name={item.name}
                            as={NavLink}
                            to={item.to}
                            active={activeItem === item.name}
                            onClick={() => handleItemClick(item.name)}
                        />
                    );
                })}

                <Menu.Menu position='right'>
                    <Menu.Item style={{ padding: 0 }}>
                        <Dropdown item icon={<Icon name="user" />} text={user.username || "Usuario"}>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={handleLogout} icon="power off" content="Cerrar sesión" />
                            </Dropdown.Menu>
                        </Dropdown>
                    </Menu.Item>
                </Menu.Menu>
            </Menu>

            {/* --- MENÚ MOBILE --- */}
            <div className="mobile-menu">
                <Menu style={{ marginBottom: 0 }}>
                    <Menu.Item icon='bars' onClick={() => setVisible(true)} />
                    <Menu.Item position='right'>Usuario: {user.username}</Menu.Item>
                </Menu>

                <Sidebar
                    as={Menu}
                    animation='overlay'
                    visible={visible}
                    onHide={() => setVisible(false)}
                    vertical
                >
                    <Menu.Item><Image size='tiny' src={logo} centered /></Menu.Item>

                    {menuConfig.map((item) => {
                        if (!hasPermission(item)) return null;

                        if (item.isDropdown) {
                            return (
                                <Menu.Item key={item.name}>
                                    <Menu.Header>{item.name}</Menu.Header>
                                    <Menu.Menu>
                                        {item.children.map(child => (
                                            <Menu.Item
                                                key={child.name}
                                                as={NavLink}
                                                to={child.to}
                                                content={child.name}
                                                onClick={() => handleItemClick(child.name)}
                                            />
                                        ))}
                                    </Menu.Menu>
                                </Menu.Item>
                            );
                        }

                        return (
                            <Menu.Item
                                key={item.name}
                                as={NavLink}
                                to={item.to}
                                content={item.name}
                                onClick={() => handleItemClick(item.name)}
                            />
                        );
                    })}

                    <Menu.Item onClick={handleLogout} style={{ color: 'red' }}>
                        <Icon name='power' /> Salir
                    </Menu.Item>
                </Sidebar>
            </div>

            {/* --- RUTAS --- */}
            <Segment secondary style={{ marginTop: 0, minHeight: '85vh', padding: 0 }}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<App />} />
                        <Route path="/preparacion" element={<Preparacion />} />
                        <Route path="/chequeo" element={<Chequeo />} />
                        <Route path="/embalaje" element={<Embalaje />} />
                        <Route path="/monitor/:buscar?" element={<Monitor />} />
                        <Route path="/despacho" element={<Despacho />} />
                        <Route path="/guias" element={<Guias />} />
                        <Route path="/predespacho" element={<PreDespacho />} />
                        {/* Agrega aquí la ruta de Empresa cuando tengas el componente */}
                        <Route path="/empresa" element={<Empresa/>} />

                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/listteam/:buscar?" element={<ListTeam />} />
                        </Route>
                    </Route>
                </Routes>
            </Segment>
        </>
    );
}