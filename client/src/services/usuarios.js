import { api } from "../api";

// filtros: { q, role, disponibles }
export const buscarUsuarios = async (filtros) => {
  const res = await api.get("/usuarios", { params: filtros });
  return res.data;
};

export const obtenerPerfil = async (id) => {
  const res = await api.get(`/usuarios/${id}`);
  return res.data;
};

export const bloquearUsuario = async (id) => {
  const res = await api.post(`/usuarios/${id}/bloqueo`);
  return res.data;
};

export const desbloquearUsuario = async (id) => {
  const res = await api.delete(`/usuarios/${id}/bloqueo`);
  return res.data;
};

export const listarBloqueados = async () => {
  const res = await api.get("/usuarios/bloqueados");
  return res.data;
};
