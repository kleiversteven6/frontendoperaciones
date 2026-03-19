// src/services/api.js
import axios from "axios";
import { authlogin,authRegister,orders, users } from "../context/globalvars";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8002",
  timeout: 10000,
});

// Obtener items de un pedido por código
export async function fetchOrderItems(orderCode) {
  const response = await api.get(`${orders}/${encodeURIComponent(orderCode)}`);
  return response.data; // { orderCode, items: [...], status }
}

// Asignar trabajador a una etapa del pedido
export async function assignWorkerToStage(orderCode, workerNumber, stage) {
  const response = await api.post(`${orders}/${encodeURIComponent(orderCode)}/assign`, {
    workerNumber,
    stage,
  });
  return response.data; // { ok: true, orderCode, stage, assignedTo }
}

// Login de usuario
export async function login(username, password) {
  const response = await api.post(authlogin, { username, password });
  console.log(response);
  
  return response.data; // { message, token, user }
}

// Registro de usuario
export async function register(username, password, role = "user", token) {
  const response = await api.post(
    authRegister,
    { username, password, role }, // Cuerpo de la solicitud (datos)
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    }
  );
  return response.data; // { message }
}


// Obtener usuarios
export async function getUsers() {
  const response = await api.get(users);
  return response.data; // [{id, username, role, created_at}, ...]
}

// Actualizar usuario
export async function updateUser(id, data) {
  const response = await api.put(`${users}/${id}`, data);
  return response.data; // { message }
}

// Eliminar usuario
export async function deleteUser(id) {
  const response = await api.delete(`${users}/${id}`);
  return response.data; // { message }
}

export default api;
