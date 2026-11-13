import { api } from "../api";

export const obtenerCuenta = async () => {
  const res = await api.get("/auth/yo");
  return res.data;
};

// Crear el PIN de firma (o cambiarlo, enviando también pinActual)
export const guardarPin = async ({ password, pin, pinActual }) => {
  const res = await api.put("/auth/pin", { password, pin, pinActual });
  return res.data;
};

// datos: { nombre, apellido, telefono, compania }
export const actualizarCuenta = async (datos) => {
  const res = await api.put("/auth/yo", datos);
  return res.data;
};

export const cambiarPassword = async ({ actual, nueva }) => {
  const res = await api.put("/auth/password", { actual, nueva });
  return res.data;
};
