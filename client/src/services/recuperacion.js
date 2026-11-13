import { api } from "../api";

const base = "/auth/recuperacion";

export const solicitarRecuperacion = async (email) => {
  const res = await api.post(`${base}/solicitar`, { email });
  return res.data;
};

// { valido, email (enmascarado), expiraEn }
export const validarEnlace = async (token) => {
  const res = await api.get(`${base}/validar`, { params: { token } });
  return res.data;
};

export const restablecerPassword = async (token, nueva) => {
  const res = await api.post(`${base}/restablecer`, { token, nueva });
  return res.data;
};
