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
import logo from '../../assets/logo.jpeg';
import ListTeam from '../ListTeam';
import Despacho from '../Despacho';
import Guias from '../Guias';
import { ToastContainer } from 'react-toastify';

export default function Template() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [activeItem, setActiveItem] = useState("Home");
    const [visible, setVisible] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    const optionsMenu = [
        { name: 'preparacion', from: 'preparacion', role: '' },
        { name: 'chequeo', from: 'chequeo', role: '' },
        { name: 'embalaje', from: 'embalaje', role: '' },
        { name: 'monitor', from: 'monitor', role: '' },
        { name: 'admin', from: 'admin', role: 'admin' },
        { name: 'users', from: 'users', role: 'admin' },
        { name: 'dashboard', from: 'dashboard', role: 'admin' },
        { name: 'listteam', from: 'listteam', role: 'admin' },
        { name: 'Despacho', from: 'despacho', role: '' },
        { name: 'Guias', from: 'guias', role: '' }
    ];
    const options = [
        { key: 'user', text: 'Account', icon: 'user' },
        { key: 'settings', text: 'Settings', icon: 'settings' },
        { key: 'sign-out', text: 'Sign Out', icon: 'sign out' },
    ]

    const handleItemClick = (name) => {
        setActiveItem(name);
        setVisible(false); // Cierra el sidebar al seleccionar una opción
    };

    return (
        <>
        <ToastContainer  />
            {/* Menú para desktop */}
            <Menu style={{ marginBottom: 0, display: 'flex', flexWrap: 'nowrap' }} tabular className="desktop-menu">
                {<Menu.Item>
                    <Image size='tiny' src={logo} />
                </Menu.Item>}
                <Menu.Item
                    name='Inicio'
                    active={activeItem === 'Inicio'}
                    onClick={() => handleItemClick('Inicio')}
                    as={NavLink}
                    to="/"
                />
                {optionsMenu.map((m) =>
                    m.role === '' || m.role === user.role ? (
                        <Menu.Item
                            key={m.name}
                            name={m.name}
                            active={activeItem === m.name}
                            onClick={() => handleItemClick(m.name)}
                            as={NavLink}
                            to={`/${m.from}`}
                        />
                    ) : null
                )}
                <Menu.Menu position='right'>
                    <Menu.Item style={{ padding: 0 }}>
                        <Dropdown
                            item
                            icon={<Icon name="user  " size="large" />}
                            className="icon"
                            text={user.username || "Usuario"}
                        >
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={()=>handleLogout()}>
                                    <Icon name="power off" />
                                    Cerrar sesion
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Menu.Item>
                </Menu.Menu>



            </Menu>

            {/* Menú para mobile (Sidebar) */}
            <div className="mobile-menu">
                <Menu style={{ marginBottom: 0 }}>
                    <Menu.Item>
                        <Button icon onClick={() => setVisible(!visible)}>
                            <Icon name='bars' />
                        </Button>
                    </Menu.Item>
                    <Menu.Item position='right'>
                        Hola, <span className="font-semibold">{user.username || "Usuario"}</span>
                    </Menu.Item>
                </Menu>
                <Sidebar
                    as={Menu}
                    animation='overlay'
                    direction='left'
                    visible={visible}
                    onHide={() => setVisible(false)}
                    vertical
                >
                    <Menu.Item>
                        <Image size='tiny' src={logo} style={{ margin: '10px auto' }} />
                    </Menu.Item>
                    <Menu.Item
                        name='Inicio'
                        active={activeItem === 'Inicio'}
                        onClick={() => handleItemClick('Inicio')}
                        as={NavLink}
                        to="/"
                    />
                    {optionsMenu.map((m) =>
                        m.role === '' || m.role === user.role ? (
                            <Menu.Item
                                key={m.name}
                                name={m.name}
                                active={activeItem === m.name}
                                onClick={() => handleItemClick(m.name)}
                                as={NavLink}
                                to={`/${m.from}`}
                            />
                        ) : null
                    )}
                    <Menu.Item style={{ color: "red" }} onClick={handleLogout}>
                        <Icon name='power' />
                        Salir
                    </Menu.Item>
                </Sidebar>
            </div>

            {/* Contenido principal */}
            <Segment secondary style={{ marginTop: 0, padding: 0 }}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<App />} />
                        <Route path="/preparacion" element={<Preparacion />} />
                        <Route path="/chequeo" element={<Chequeo />} />
                        <Route path="/embalaje" element={<Embalaje />} />
                        <Route path="/monitor/:buscar?" element={<Monitor />} />
                        <Route path="/despacho" element={<Despacho />} />
                        <Route path="/guias" element={<Guias />} />

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
