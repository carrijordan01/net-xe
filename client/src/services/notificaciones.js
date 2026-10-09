import { api } from "../api";

export const obtenerNotificaciones = async () => {
  const res = await api.get("/notificaciones");
  return res.data;
};

export const marcarLeida = async (id) => {
  await api.put(`/notificaciones/${id}/leido`);
};
