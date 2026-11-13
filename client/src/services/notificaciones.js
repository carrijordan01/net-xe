import { api } from "../api";

// { notificaciones, noLeidas }
export const obtenerNotificaciones = async () => {
  const res = await api.get("/notificaciones");
  return res.data;
};

export const marcarLeida = async (id) => {
  await api.put(`/notificaciones/${id}/leido`);
};

export const marcarTodasLeidas = async () => {
  await api.put("/notificaciones/leidas");
};
