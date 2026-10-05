import axios from "axios";

const API_URL = "http://localhost:4000/contratos";

export const obtenerContrato = async (id) => {
  const token = localStorage.getItem("token");

  const res = await axios.get(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data.contrato;
};

export const editarContrato = async (id, datos) => {
  const token = localStorage.getItem("token");

  const res = await axios.put(`${API_URL}/${id}`, datos, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

export const firmarProponente = async (id) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${API_URL}/${id}/firmar/proponente`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
};

export const firmarSolicitante = async (id) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(
    `${API_URL}/${id}/firmar/solicitante`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data;
};

export const descargarPDF = async (id) => {
  const token = localStorage.getItem("token");

  const res = await axios.get(`${API_URL}/${id}/pdf`, {
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

export const crearContrato = async (payload) => {
  const token = localStorage.getItem("token");

  const res = await axios.post(API_URL, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

export const buscarContratos = async (filtros) => {
  const token = localStorage.getItem("token");

  const params = new URLSearchParams(filtros);

  const res = await axios.get(`${API_URL}/buscar?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};
