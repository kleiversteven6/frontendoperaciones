import { Link, Routes, Route, useNavigate } from "react-router-dom";
import Monitor from "./pages/Monitor";
import { Card, Grid, Header, Icon, Segment, Statistic } from "semantic-ui-react";
import { useEffect, useState } from "react";


export default function App() {
  const [device, setDevice] = useState("desktop");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const optionsMenu = [
    { text: 'Preparacion', icon: 'clipboard list', to: '/preparacion', desc: 'Gestión y armado de pedidos para despacho.', color: 'blue', user: 'all' },
    { text: 'Chequeo', icon: 'check', to: '/chequeo', desc: 'Verificación de items y cantidades.', color: 'green', user: 'all' },
    { text: 'Embalaje', icon: 'box', to: '/embalaje', desc: ' Empaquetado y etiquetado final.', color: 'purple', user: 'all' },
    { text: 'Monitor', icon: 'tv', to: '/monitor', desc: 'Visualización de estado en tiempo real.', color: 'olive', user: 'all' },
    { text: 'Admin', icon: 'cogs', to: '/admin', desc: 'Gestión de procesos y retrocesos.', color: 'red', user: 'admin' },
    { text: 'Usuarios', icon: 'users', to: '/usuarios', desc: 'Gestión de operadores y administradores.', color: 'teal', user: 'admin' },
    { text: 'Productividad', icon: 'chart bar', to: '/productividad', desc: 'Gestión y armado de pedidos para despacho.', color: 'orange', user: 'admin' },
    { text: 'List Team', icon: 'ordered list', to: '/listeam', desc: 'Gestión y armado de pedidos para despacho.', color: 'brown', user: 'admin' },
    { text: 'Despacho', icon: 'truck', to: '/despacho', desc: 'Gestión y armado de pedidos para despacho.', color: 'pink', user: 'all' },
    { text: 'Guias', icon: 'truck', to: '/despacho', desc: 'Lista de guias generadas.', color: 'violet', user: 'all' },
  ];
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDevice("mobile");
      } else if (window.innerWidth < 992) {
        setDevice("tablet");
      } else if (window.innerWidth < 1200) {
        setDevice("desktop");
      } else {
        setDevice("large");

      }
    };

    // Ejecuta la función handleResize al montar el componente
    handleResize();

    // Ejecuta la función handleResize cada vez que se redimensiona la ventana
    window.addEventListener("resize", handleResize);

    // Limpia el evento al desmontar el componente
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const columns = device === "mobile" ? 1 : device === "tablet" ? 2 : device === "desktop" ? 4 : 4;

  return (

    <Segment secondary style={{ minHeight: '100vh' }}>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Centro de Operaciones
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Seleccione el módulo operativo para comenzar
        </p>
      </div>
      <Grid columns={columns} padded >
        {optionsMenu.map((o) =>
          o.user == 'all' || user.role == o.user ?

          <Grid.Column textAlign="center" >
            <Link to={o.to} >
              <Card style={{ margin: 'auto' }} image color={o.color} >
                <Card.Content>
                  <Icon name={o.icon} size="big" color={o.color} />
                  <Header>{o.text}</Header>
                </Card.Content>
                <Card.Meta>{o.desc}</Card.Meta>
              </Card>
            </Link>

          </Grid.Column>: null)}
      </Grid>

    </Segment>
  );
}
