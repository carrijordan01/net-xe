import { api } from "../api";

export const obtenerContrato = async (id) => {
  const res = await api.get(`/contratos/${id}`);
  return res.data;
};

export const editarContrato = async (id, datos) => {
  const res = await api.put(`/contratos/${id}`, datos);
  return res.data;
};

export const aceptarContrato = async (id) => {
  const res = await api.post(`/contratos/${id}/aceptar`);
  return res.data;
};

export const rechazarContrato = async (id, motivo) => {
  const res = await api.post(`/contratos/${id}/rechazar`, { motivo });
  return res.data;
};

// credenciales: { acepto, password, pin }
export const firmarContrato = async (id, credenciales) => {
  const res = await api.post(`/contratos/${id}/firmar`, credenciales);
  return res.data;
};

// Devuelve { blob, nombre } con el nombre de archivo que propone el servidor
export const descargarPDF = async (id) => {
  const res = await api.get(`/contratos/${id}/pdf`, { responseType: "blob" });
  const nombre = /filename="([^"]+)"/.exec(res.headers["content-disposition"] ?? "")?.[1] ?? `contrato-${id}.pdf`;
  return { blob: res.data, nombre };
};

export const crearContrato = async (payload) => {
  const res = await api.post("/contratos", payload);
  return res.data;
};

export const buscarContratos = async (filtros) => {
  const res = await api.get("/contratos/buscar", { params: filtros });
  return res.data;
};

export const resumenContratos = async () => {
  const res = await api.get("/contratos/resumen");
  return res.data;
};

export const eliminarContrato = async (id) => {
  const res = await api.delete(`/contratos/${id}`);
  return res.data;
};

export const obtenerHistorial = async (id) => {
  const res = await api.get(`/contratos/${id}/historial`);
  return res.data;
};
