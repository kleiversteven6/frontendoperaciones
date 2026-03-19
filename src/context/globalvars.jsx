const defaultRoute = "api";

export function getDominio(routeApi = defaultRoute) {
  const serverName = window.location.hostname;

  //return `http://192.168.68.110:8002/${routeApi}/`;
  return `http://${serverName}:8002/${routeApi}/`;
}

//RUTAS LOGIN
export var authlogin = getDominio() + "auth/login";
export var orders = getDominio() + "orders";
export var authRegister = getDominio() + "auth/register";
export var users = getDominio() + "users";


export var processLogs = getDominio() + "pedidos/process-logs";
export var processLog = getDominio() + "pedidos/process-log";
export var pedidosFacturas = getDominio() + "pedidos/factura";
export var pedidosConfirmar = getDominio() + "pedidos/confirmar";
export var pedidosRelease = getDominio() + "pedidos/release";
export var pedidosLabel = getDominio() + "pedidos/label";
export var pedidosUpdate = getDominio() + "pedidos/update";
export var adminStats = getDominio() + "admin/stats"; 
export var rnotasFactRecientes = getDominio() + "rnotas/facturas-recientes";
export var pedidosArticulos = getDominio() + "pedidos/articulos";
export var pedidosAdd = getDominio() + "pedidos/add";
export var pedidosRemove = getDominio() + "pedidos/remove";

//Rutas creadas por kleiver
export var filtrosZonasSegmentos = getDominio() + "others/filtros";
export var listaguias = getDominio() + "pedidos/listaguia";
export var crearguia = getDominio() + "pedidos/crearguia";
export var guiapdf = getDominio() + "pedidos/guiapdf";
export var pedidosDespachar = getDominio() + "pedidos/despachar";
export var removedespachar = getDominio() + "pedidos/removedespachar";