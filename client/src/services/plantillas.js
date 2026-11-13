import { api } from "../api";

export const obtenerCatalogo = async () => {
  const res = await api.get("/plantillas");
  return res.data;
};

export const obtenerPlantilla = async (tipo) => {
  const res = await api.get(`/plantillas/${tipo}`);
  return res.data;
};
