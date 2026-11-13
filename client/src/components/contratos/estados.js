// Presentación de los estados de un contrato

export const ESTADOS = {
  PENDIENTE: { texto: "Pendiente de revisión", clase: "bg-amber-100 text-amber-800" },
  ACEPTADO: { texto: "Aceptado · por firmar", clase: "bg-blue-100 text-blue-800" },
  FIRMADO: { texto: "Firmado", clase: "bg-green-100 text-green-800" },
  RECHAZADO: { texto: "Rechazado", clase: "bg-red-100 text-red-700" },
  ELIMINADO: { texto: "Eliminado", clase: "bg-gray-200 text-gray-700" }
};

// Nombre para mostrar: el título propio del contrato simple o el de la plantilla
export function tituloContrato(contrato, catalogo) {
  if (contrato.tipo === "CONTRATO_SIMPLE" && contrato.datos?.titulo) return contrato.datos.titulo;
  const plantilla = catalogo?.plantillas.find((p) => p.tipo === contrato.tipo);
  return plantilla?.nombre ?? contrato.tipo.replaceAll("_", " ").toLowerCase();
}

// Puede editarse o eliminarse directamente mientras nadie lo haya firmado
export function editableSinSolicitud(contrato) {
  return (
    !contrato.firmadoSolicitante &&
    !contrato.firmadoContraparte &&
    ["PENDIENTE", "ACEPTADO"].includes(contrato.estado)
  );
}

// Con firmas, editar o eliminar requiere una solicitud a la contraparte
export function requiereSolicitud(contrato) {
  return (
    ["ACEPTADO", "FIRMADO"].includes(contrato.estado) &&
    (contrato.firmadoSolicitante || contrato.firmadoContraparte)
  );
}

export const ESTADOS_SOLICITUD = {
  PENDIENTE: { texto: "Pendiente", clase: "bg-amber-100 text-amber-800" },
  APROBADA: { texto: "Aprobada", clase: "bg-green-100 text-green-800" },
  RECHAZADA: { texto: "Rechazada", clase: "bg-red-100 text-red-700" },
  CANCELADA: { texto: "Cancelada", clase: "bg-gray-200 text-gray-700" }
};
