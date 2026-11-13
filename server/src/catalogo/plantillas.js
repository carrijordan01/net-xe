// Catálogo de plantillas de contrato de Net-xe.
// Es la única definición de los tipos de contrato: el servidor la usa para
// validar los datos y el cliente para mostrar el catálogo y los formularios.
//
// Tipos de campo: texto, textoLargo, numero, moneda (CLP), porcentaje, fecha,
// seleccion (requiere "opciones") y siNo.

export const CATEGORIAS = {
  LABORAL: "Laborales",
  SERVICIOS: "Prestación de servicios",
  COMPRAVENTA: "Compraventa",
  COMERCIAL: "Comerciales y mercantiles",
  CIVIL: "Civiles patrimoniales",
  GENERICA: "Plantilla genérica"
};

export const NIVELES = {
  COMPLETA: "Completa",
  SIMPLIFICADA: "Simplificada",
  GENERICA: "Genérica"
};

export const MODALIDADES = {
  EJECUCION_INMEDIATA: "Ejecución inmediata",
  TRACTO_SUCESIVO: "Tracto sucesivo"
};

const FORMAS_PAGO = ["Transferencia bancaria", "Depósito bancario", "Efectivo", "Cheque"];

// Campos que se repiten entre plantillas
const c = {
  cargo: { nombre: "cargo", etiqueta: "Cargo", tipo: "texto", requerido: true },
  funciones: { nombre: "funciones", etiqueta: "Funciones principales", tipo: "textoLargo", requerido: true },
  lugarTrabajo: { nombre: "lugarTrabajo", etiqueta: "Lugar de trabajo", tipo: "texto", requerido: true },
  distribucionJornada: {
    nombre: "distribucionJornada", etiqueta: "Distribución de la jornada", tipo: "texto", requerido: true,
    ayuda: "Ejemplo: lunes a viernes de 9:00 a 18:00, con 1 hora de colación."
  },
  remuneracionMensual: { nombre: "remuneracionMensual", etiqueta: "Remuneración bruta mensual", tipo: "moneda", requerido: true },
  formaPago: { nombre: "formaPago", etiqueta: "Forma de pago", tipo: "seleccion", opciones: FORMAS_PAGO, requerido: true },
  diaPago: { nombre: "diaPago", etiqueta: "Día de pago de cada mes", tipo: "numero", min: 1, max: 31, requerido: true },
  direccionInmueble: { nombre: "direccionInmueble", etiqueta: "Dirección del inmueble", tipo: "texto", requerido: true }
};

const plantillas = [
  // ---------- Laborales ----------
  {
    tipo: "INDEFINIDO",
    nombre: "Contrato de trabajo indefinido",
    categoria: "LABORAL",
    nivel: "COMPLETA",
    descripcion: "Relación laboral sin fecha de término, con jornada, funciones y remuneración definidas.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      c.cargo, c.funciones, c.lugarTrabajo,
      { nombre: "horasSemanales", etiqueta: "Horas de trabajo semanales", tipo: "numero", min: 1, max: 45, requerido: true,
        ayuda: "Debe respetar la jornada ordinaria máxima legal vigente." },
      c.distribucionJornada, c.remuneracionMensual, c.formaPago, c.diaPago,
      { nombre: "beneficios", etiqueta: "Beneficios adicionales", tipo: "textoLargo", ayuda: "Bonos, asignaciones de colación o movilización, etc." }
    ]
  },
  {
    tipo: "PLAZO_FIJO",
    nombre: "Contrato de trabajo a plazo fijo",
    categoria: "LABORAL",
    nivel: "COMPLETA",
    descripcion: "Relación laboral con una fecha de término determinada.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    fechaTermino: { requerida: true, etiqueta: "Fecha de término del contrato" },
    campos: [
      c.cargo, c.funciones, c.lugarTrabajo,
      { nombre: "horasSemanales", etiqueta: "Horas de trabajo semanales", tipo: "numero", min: 1, max: 45, requerido: true,
        ayuda: "Debe respetar la jornada ordinaria máxima legal vigente." },
      c.distribucionJornada, c.remuneracionMensual, c.formaPago, c.diaPago,
      { nombre: "motivo", etiqueta: "Motivo del plazo fijo", tipo: "texto", ayuda: "Ejemplo: aumento temporal de la demanda." }
    ]
  },
  {
    tipo: "JORNADA_PARCIAL",
    nombre: "Contrato de trabajo a jornada parcial",
    categoria: "LABORAL",
    nivel: "COMPLETA",
    descripcion: "Relación laboral con una jornada menor a la ordinaria.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      c.cargo, c.funciones, c.lugarTrabajo,
      {
        nombre: "horasSemanales", etiqueta: "Horas de trabajo semanales", tipo: "numero", min: 1, max: 30, requerido: true,
        ayuda: "La jornada parcial no puede superar dos tercios de la jornada ordinaria."
      },
      c.distribucionJornada, c.remuneracionMensual, c.formaPago, c.diaPago
    ]
  },
  {
    tipo: "OBRA_FAENA",
    nombre: "Contrato por obra o faena",
    categoria: "LABORAL",
    nivel: "SIMPLIFICADA",
    descripcion: "Trabajo que termina al concluir una obra o faena determinada.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      { nombre: "descripcionObra", etiqueta: "Obra o faena", tipo: "textoLargo", requerido: true },
      { nombre: "ubicacionObra", etiqueta: "Ubicación de la obra", tipo: "texto", requerido: true },
      c.cargo,
      { nombre: "remuneracion", etiqueta: "Remuneración", tipo: "moneda", requerido: true },
      { nombre: "jornada", etiqueta: "Jornada", tipo: "texto", requerido: true }
    ]
  },
  {
    tipo: "REEMPLAZO",
    nombre: "Contrato de reemplazo",
    categoria: "LABORAL",
    nivel: "SIMPLIFICADA",
    descripcion: "Trabajo para cubrir temporalmente a otro trabajador ausente.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      { nombre: "trabajadorReemplazado", etiqueta: "Trabajador reemplazado", tipo: "texto", requerido: true },
      { nombre: "motivoReemplazo", etiqueta: "Motivo del reemplazo", tipo: "texto", requerido: true, ayuda: "Ejemplo: licencia médica, vacaciones." },
      c.cargo,
      { nombre: "remuneracion", etiqueta: "Remuneración", tipo: "moneda", requerido: true }
    ]
  },

  // ---------- Prestación de servicios ----------
  {
    tipo: "SERVICIOS_PROFESIONALES",
    nombre: "Prestación de servicios profesionales",
    categoria: "SERVICIOS",
    nivel: "COMPLETA",
    descripcion: "Encargo de un servicio a un profesional o independiente, sin relación laboral.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      { nombre: "servicio", etiqueta: "Descripción del servicio", tipo: "textoLargo", requerido: true },
      { nombre: "entregables", etiqueta: "Entregables", tipo: "textoLargo" },
      { nombre: "honorarios", etiqueta: "Honorarios", tipo: "moneda", requerido: true },
      {
        nombre: "periodicidadPago", etiqueta: "Periodicidad del pago", tipo: "seleccion", requerido: true,
        opciones: ["Pago único", "Mensual", "Por avance o hito"]
      },
      c.formaPago,
      { nombre: "plazoEjecucion", etiqueta: "Plazo de ejecución", tipo: "texto", ayuda: "Ejemplo: 3 meses desde la fecha de inicio." },
      { nombre: "lugarPrestacion", etiqueta: "Lugar de prestación", tipo: "texto", ayuda: "Ejemplo: remoto, oficinas del solicitante." },
      { nombre: "confidencialidad", etiqueta: "Incluir cláusula de confidencialidad", tipo: "siNo" }
    ]
  },

  // ---------- Compraventa ----------
  {
    tipo: "COMPRAVENTA_BIENES",
    nombre: "Compraventa de bienes muebles",
    categoria: "COMPRAVENTA",
    nivel: "COMPLETA",
    descripcion: "Venta de bienes muebles como equipos, vehículos menores, mercadería o mobiliario.",
    modalidadSugerida: "EJECUCION_INMEDIATA",
    campos: [
      { nombre: "descripcionBien", etiqueta: "Descripción del bien", tipo: "textoLargo", requerido: true },
      { nombre: "cantidad", etiqueta: "Cantidad", tipo: "numero", min: 1, requerido: true },
      { nombre: "estadoBien", etiqueta: "Estado del bien", tipo: "seleccion", opciones: ["Nuevo", "Usado"], requerido: true },
      { nombre: "precio", etiqueta: "Precio total", tipo: "moneda", requerido: true },
      c.formaPago,
      { nombre: "fechaEntrega", etiqueta: "Fecha de entrega", tipo: "fecha", requerido: true },
      { nombre: "lugarEntrega", etiqueta: "Lugar de entrega", tipo: "texto", requerido: true },
      { nombre: "garantia", etiqueta: "Garantía", tipo: "texto", ayuda: "Ejemplo: 6 meses contra defectos de fabricación." }
    ]
  },
  {
    tipo: "COMPRAVENTA_DOMINIO",
    nombre: "Compraventa de dominio (inmueble)",
    categoria: "COMPRAVENTA",
    nivel: "SIMPLIFICADA",
    descripcion: "Acuerdo de venta de un bien raíz entre las partes.",
    modalidadSugerida: "EJECUCION_INMEDIATA",
    advertencia:
      "La compraventa de bienes raíces requiere escritura pública ante notario e inscripción en el Conservador de Bienes Raíces. Este documento deja constancia del acuerdo entre las partes, pero no reemplaza esos trámites.",
    campos: [
      c.direccionInmueble,
      { nombre: "rolAvaluo", etiqueta: "Rol de avalúo (SII)", tipo: "texto", requerido: true },
      { nombre: "precioVenta", etiqueta: "Precio de venta", tipo: "moneda", requerido: true },
      c.formaPago,
      { nombre: "fechaEntrega", etiqueta: "Fecha de entrega material", tipo: "fecha", requerido: true }
    ]
  },

  // ---------- Comerciales y mercantiles ----------
  {
    tipo: "AGENCIA",
    nombre: "Contrato de agencia",
    categoria: "COMERCIAL",
    nivel: "SIMPLIFICADA",
    descripcion: "Un agente promueve o cierra negocios por cuenta del solicitante a cambio de una comisión.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      { nombre: "territorio", etiqueta: "Territorio o zona", tipo: "texto", requerido: true },
      { nombre: "facultades", etiqueta: "Facultades del agente", tipo: "textoLargo", requerido: true },
      { nombre: "comision", etiqueta: "Comisión", tipo: "porcentaje", requerido: true },
      { nombre: "obligacionesAgente", etiqueta: "Otras obligaciones del agente", tipo: "textoLargo" }
    ]
  },
  {
    tipo: "DISTRIBUCION",
    nombre: "Contrato de distribución",
    categoria: "COMERCIAL",
    nivel: "SIMPLIFICADA",
    descripcion: "Un distribuidor compra y revende los productos del proveedor en una zona.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      { nombre: "productos", etiqueta: "Productos", tipo: "textoLargo", requerido: true },
      { nombre: "zona", etiqueta: "Zona de distribución", tipo: "texto", requerido: true },
      { nombre: "condicionesPrecio", etiqueta: "Precios y márgenes", tipo: "texto", requerido: true },
      { nombre: "exclusividad", etiqueta: "Distribución exclusiva en la zona", tipo: "siNo" }
    ]
  },
  {
    tipo: "SUMINISTRO",
    nombre: "Contrato de suministro",
    categoria: "COMERCIAL",
    nivel: "SIMPLIFICADA",
    descripcion: "Entrega periódica de productos a un precio acordado.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      { nombre: "producto", etiqueta: "Producto", tipo: "texto", requerido: true },
      { nombre: "cantidadPorEntrega", etiqueta: "Cantidad por entrega", tipo: "texto", requerido: true, ayuda: "Ejemplo: 50 cajas." },
      {
        nombre: "frecuencia", etiqueta: "Frecuencia de entrega", tipo: "seleccion", requerido: true,
        opciones: ["Semanal", "Quincenal", "Mensual", "Según pedido"]
      },
      { nombre: "precioUnitario", etiqueta: "Precio unitario", tipo: "moneda", requerido: true },
      { nombre: "lugarEntrega", etiqueta: "Lugar de entrega", tipo: "texto", requerido: true }
    ]
  },

  // ---------- Civiles patrimoniales ----------
  {
    tipo: "ARRIENDO",
    nombre: "Contrato de arriendo",
    categoria: "CIVIL",
    nivel: "COMPLETA",
    descripcion: "Arriendo de un inmueble a cambio de una renta mensual.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    campos: [
      c.direccionInmueble,
      { nombre: "destino", etiqueta: "Destino del inmueble", tipo: "seleccion", opciones: ["Habitacional", "Comercial", "Otro"], requerido: true },
      { nombre: "rentaMensual", etiqueta: "Renta mensual", tipo: "moneda", requerido: true },
      c.diaPago, c.formaPago,
      { nombre: "garantia", etiqueta: "Garantía (mes de garantía)", tipo: "moneda" },
      { nombre: "reajuste", etiqueta: "Reajuste de la renta", tipo: "texto", ayuda: "Ejemplo: según IPC cada 12 meses." },
      {
        nombre: "gastosComunes", etiqueta: "Gastos comunes", tipo: "seleccion",
        opciones: ["Incluidos en la renta", "De cargo del arrendatario", "No aplica"]
      },
      { nombre: "inventario", etiqueta: "Inventario o estado del inmueble", tipo: "textoLargo" }
    ]
  },
  {
    tipo: "COMODATO",
    nombre: "Contrato de comodato (préstamo de uso)",
    categoria: "CIVIL",
    nivel: "COMPLETA",
    descripcion: "Préstamo gratuito de un bien para su uso, con obligación de devolverlo.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    fechaTermino: { requerida: true, etiqueta: "Fecha de devolución" },
    campos: [
      { nombre: "bien", etiqueta: "Bien prestado", tipo: "textoLargo", requerido: true },
      { nombre: "estadoBien", etiqueta: "Estado del bien al entregarlo", tipo: "texto", requerido: true },
      { nombre: "usoPermitido", etiqueta: "Uso permitido", tipo: "texto", requerido: true },
      { nombre: "lugarUso", etiqueta: "Lugar de uso", tipo: "texto" },
      { nombre: "obligaciones", etiqueta: "Obligaciones adicionales", tipo: "textoLargo", ayuda: "Ejemplo: mantención, seguros." }
    ]
  },
  {
    tipo: "DONACION",
    nombre: "Contrato de donación",
    categoria: "CIVIL",
    nivel: "SIMPLIFICADA",
    descripcion: "Transferencia gratuita de un bien a la otra parte.",
    modalidadSugerida: "EJECUCION_INMEDIATA",
    advertencia:
      "Según su monto y el tipo de bien, una donación puede requerir trámites adicionales (como la insinuación judicial o escritura pública) y el pago de impuestos.",
    campos: [
      { nombre: "bienDonado", etiqueta: "Bien donado", tipo: "textoLargo", requerido: true },
      { nombre: "valorEstimado", etiqueta: "Valor estimado", tipo: "moneda" },
      { nombre: "condiciones", etiqueta: "Condiciones o cargas", tipo: "textoLargo" }
    ]
  },
  {
    tipo: "MUTUO",
    nombre: "Contrato de mutuo (préstamo de dinero)",
    categoria: "CIVIL",
    nivel: "SIMPLIFICADA",
    descripcion: "Préstamo de una suma de dinero que debe devolverse en el plazo acordado.",
    modalidadSugerida: "TRACTO_SUCESIVO",
    fechaTermino: { requerida: true, etiqueta: "Fecha límite de devolución" },
    campos: [
      { nombre: "monto", etiqueta: "Monto prestado", tipo: "moneda", requerido: true },
      { nombre: "interesAnual", etiqueta: "Interés anual", tipo: "porcentaje", ayuda: "Déjalo vacío si el préstamo no tiene interés." },
      { nombre: "formaDevolucion", etiqueta: "Forma de devolución", tipo: "seleccion", opciones: ["Pago único", "En cuotas"], requerido: true },
      { nombre: "numeroCuotas", etiqueta: "Número de cuotas", tipo: "numero", min: 1, ayuda: "Solo si se devuelve en cuotas." }
    ]
  },

  // ---------- Genérica ----------
  {
    tipo: "CONTRATO_SIMPLE",
    nombre: "Contrato simple personalizado",
    categoria: "GENERICA",
    nivel: "GENERICA",
    descripcion: "Para acuerdos que no calzan con las otras plantillas: define tú el objeto y las obligaciones.",
    modalidadSugerida: null,
    campos: [
      { nombre: "titulo", etiqueta: "Título del contrato", tipo: "texto", requerido: true },
      { nombre: "objeto", etiqueta: "Objeto del contrato", tipo: "textoLargo", requerido: true, ayuda: "Qué se acuerda, en pocas palabras." },
      { nombre: "obligacionesSolicitante", etiqueta: "Obligaciones del solicitante", tipo: "textoLargo", requerido: true },
      { nombre: "obligacionesContraparte", etiqueta: "Obligaciones de la contraparte", tipo: "textoLargo", requerido: true },
      { nombre: "monto", etiqueta: "Monto involucrado", tipo: "moneda" },
      { nombre: "clausulasAdicionales", etiqueta: "Cláusulas adicionales", tipo: "textoLargo" }
    ]
  }
];

// Datos comunes a todas las plantillas (se guardan junto a los campos propios)
export const CAMPOS_COMUNES = [
  { nombre: "ciudad", etiqueta: "Ciudad de celebración", tipo: "texto", requerido: true },
  { nombre: "fechaInicio", etiqueta: "Fecha de inicio", tipo: "fecha", requerido: true },
  { nombre: "rutSolicitante", etiqueta: "RUT del solicitante", tipo: "texto", requerido: true },
  { nombre: "domicilioSolicitante", etiqueta: "Domicilio del solicitante", tipo: "texto", requerido: true },
  { nombre: "rutContraparte", etiqueta: "RUT de la contraparte", tipo: "texto", ayuda: "Si no lo conoces, déjalo vacío." },
  { nombre: "domicilioContraparte", etiqueta: "Domicilio de la contraparte", tipo: "texto" }
];

export const TIPOS_CONTRATO = plantillas.map((p) => p.tipo);

export function obtenerPlantilla(tipo) {
  return plantillas.find((p) => p.tipo === tipo) || null;
}

export function listarPlantillas() {
  return plantillas;
}

// ---------- Validación de los datos de un contrato según su plantilla ----------

const vacio = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function normalizarCampo(campo, valor) {
  switch (campo.tipo) {
    case "numero":
    case "moneda":
    case "porcentaje": {
      const n = Number(valor);
      if (!Number.isFinite(n)) return { error: "debe ser un número" };
      if (campo.tipo === "moneda" && (n < 0 || !Number.isInteger(n))) return { error: "debe ser un monto entero en pesos" };
      if (campo.tipo === "porcentaje" && (n < 0 || n > 100)) return { error: "debe estar entre 0 y 100" };
      if (campo.min !== undefined && n < campo.min) return { error: `debe ser al menos ${campo.min}` };
      if (campo.max !== undefined && n > campo.max) return { error: `no puede superar ${campo.max}` };
      return { valor: n };
    }
    case "fecha":
      if (typeof valor !== "string" || !FECHA_REGEX.test(valor) || Number.isNaN(Date.parse(valor))) {
        return { error: "debe ser una fecha válida" };
      }
      return { valor };
    case "seleccion":
      if (!campo.opciones.includes(valor)) return { error: "tiene una opción no válida" };
      return { valor };
    case "siNo":
      if (typeof valor !== "boolean") return { error: "debe ser sí o no" };
      return { valor };
    default:
      if (typeof valor !== "string") return { error: "debe ser texto" };
      if (valor.length > (campo.tipo === "textoLargo" ? 5000 : 300)) return { error: "es demasiado largo" };
      return { valor: valor.trim() };
  }
}

// Devuelve { errores, datos, modalidad, fechaTermino }: "datos" solo contiene
// los campos conocidos de la plantilla y los comunes, ya normalizados.
export function validarContrato({ tipo, datos, modalidad, fechaTermino }) {
  const plantilla = obtenerPlantilla(tipo);
  if (!plantilla) return { errores: { tipo: "Tipo de contrato no válido" } };

  const errores = {};
  const limpios = {};
  const entrada = datos && typeof datos === "object" && !Array.isArray(datos) ? datos : {};

  for (const campo of [...CAMPOS_COMUNES, ...plantilla.campos]) {
    const valor = entrada[campo.nombre];
    if (vacio(valor)) {
      if (campo.requerido) errores[campo.nombre] = `${campo.etiqueta} es obligatorio`;
      continue;
    }
    const r = normalizarCampo(campo, valor);
    if (r.error) errores[campo.nombre] = `${campo.etiqueta} ${r.error}`;
    else limpios[campo.nombre] = r.valor;
  }

  let modalidadFinal = null;
  if (!vacio(modalidad)) {
    if (!MODALIDADES[modalidad]) errores.modalidad = "Modalidad no válida";
    else modalidadFinal = modalidad;
  }

  let fechaTerminoFinal = null;
  if (!vacio(fechaTermino)) {
    if (typeof fechaTermino !== "string" || !FECHA_REGEX.test(fechaTermino) || Number.isNaN(Date.parse(fechaTermino))) {
      errores.fechaTermino = "Fecha de término no válida";
    } else if (limpios.fechaInicio && fechaTermino < limpios.fechaInicio) {
      errores.fechaTermino = "La fecha de término no puede ser anterior a la de inicio";
    } else {
      fechaTerminoFinal = new Date(fechaTermino);
    }
  } else if (plantilla.fechaTermino?.requerida) {
    errores.fechaTermino = `${plantilla.fechaTermino.etiqueta} es obligatoria`;
  }

  return { errores, datos: limpios, modalidad: modalidadFinal, fechaTermino: fechaTerminoFinal };
}

// Etiquetas de los datos que cambian entre la versión guardada de un contrato
// y una nueva versión ya validada (resultado de validarContrato)
export function describirCambios(tipo, guardado, nuevo) {
  const plantilla = obtenerPlantilla(tipo);
  if (!plantilla) return [];

  const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const cambios = [];

  for (const campo of [...CAMPOS_COMUNES, ...plantilla.campos]) {
    if (!igual(guardado.datos?.[campo.nombre], nuevo.datos[campo.nombre])) cambios.push(campo.etiqueta);
  }
  if (!igual(guardado.modalidad, nuevo.modalidad)) cambios.push("Modalidad");
  const fecha = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
  if (fecha(guardado.fechaTermino) !== fecha(nuevo.fechaTermino)) {
    cambios.push(plantilla.fechaTermino?.etiqueta ?? "Fecha de término");
  }
  return cambios;
}

// Nombre para mostrar de un contrato: título propio del contrato simple o nombre de la plantilla
export function nombreContrato(contrato) {
  if (contrato.tipo === "CONTRATO_SIMPLE" && contrato.datos?.titulo) return contrato.datos.titulo;
  return obtenerPlantilla(contrato.tipo)?.nombre ?? contrato.tipo;
}
