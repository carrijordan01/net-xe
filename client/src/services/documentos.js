import { api } from "../api";

const base = (contratoId) => `/contratos/${contratoId}/documentos`;

// { documentos, editables, maximo, maxBytes }
export const listarDocumentos = async (contratoId) => {
  const res = await api.get(base(contratoId));
  return res.data;
};

export const subirDocumento = async (contratoId, archivo, descripcion, alProgresar) => {
  const datos = new FormData();
  datos.append("archivo", archivo);
  if (descripcion) datos.append("descripcion", descripcion);
  const res = await api.post(base(contratoId), datos, {
    onUploadProgress: (e) => e.total && alProgresar?.(Math.round((e.loaded / e.total) * 100))
  });
  return res.data;
};

// Devuelve el archivo como Blob (la descarga necesita el token, por eso no es un enlace directo)
export const obtenerArchivo = async (contratoId, documentoId, ver = false) => {
  const res = await api.get(`${base(contratoId)}/${documentoId}`, {
    params: ver ? { ver: 1 } : undefined,
    responseType: "blob"
  });
  return res.data;
};

export const eliminarDocumento = async (contratoId, documentoId) => {
  const res = await api.delete(`${base(contratoId)}/${documentoId}`);
  return res.data;
};
