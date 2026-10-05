import axios from "axios";

const API_URL = "http://localhost:3000/notificaciones";

export const obtenerNotificaciones = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

export const marcarLeida = async (id) => {
  const token = localStorage.getItem("token");
  await axios.put(`${API_URL}/${id}/leido`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
