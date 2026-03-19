// src/utils/validators.js

export function validateOrderCode(code) {
  if (!code) return { ok: false, msg: "Código requerido" };
  const c = code.trim();
  // ejemplo: permitir alfanumérico y guiones, entre 3 y 30 caracteres
  if (!/^[A-Za-z0-9\-]{3,30}$/.test(c)) return { ok: false, msg: "Código inválido" };
  return { ok: true };
}

export function validateWorkerNumber(n) {
  if (!n) return { ok: false, msg: "Número de trabajador requerido" };
  const s = String(n).trim();
  if (!/^\d{1,6}$/.test(s)) return { ok: false, msg: "Número de trabajador inválido" };
  return { ok: true };
}
