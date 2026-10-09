import { api } from "../api";

export const obtenerContrato = async (id) => {
  const res = await api.get(`/contratos/${id}`);
  return res.data;
};

export const editarContrato = async (id, datos) => {
  const res = await api.put(`/contratos/${id}`, datos);
  return res.data;
};

export const firmarContraparte = async (id) => {
  const res = await api.post(`/contratos/${id}/firmar/contraparte`);
  return res.data;
};

export const firmarSolicitante = async (id) => {
  const res = await api.post(`/contratos/${id}/firmar/solicitante`);
  return res.data;
};

export const descargarPDF = async (id) => {
  const res = await api.get(`/contratos/${id}/pdf`, { responseType: "blob" });
  return res.data;
};

export const crearContrato = async (payload) => {
  const res = await api.post("/contratos", payload);
  return res.data;
};

export const buscarContratos = async (filtros) => {
  const res = await api.get("/contratos/buscar", { params: filtros });
  return res.data;
};
