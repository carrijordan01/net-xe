import { api } from "../api";

const base = (contratoId) => `/contratos/${contratoId}/solicitudes`;

export const listarSolicitudes = async (contratoId) => {
  const res = await api.get(base(contratoId));
  return res.data;
};

// solicitud: { tipo: "EDICION" | "ELIMINACION", motivo, datos?, modalidad?, fechaTermino? }
export const crearSolicitud = async (contratoId, solicitud) => {
  const res = await api.post(base(contratoId), solicitud);
  return res.data;
};

export const aprobarSolicitud = async (contratoId, id) => {
  const res = await api.post(`${base(contratoId)}/${id}/aprobar`);
  return res.data;
};

export const rechazarSolicitud = async (contratoId, id, respuesta) => {
  const res = await api.post(`${base(contratoId)}/${id}/rechazar`, { respuesta });
  return res.data;
};

export const cancelarSolicitud = async (contratoId, id) => {
  const res = await api.post(`${base(contratoId)}/${id}/cancelar`);
  return res.data;
};
