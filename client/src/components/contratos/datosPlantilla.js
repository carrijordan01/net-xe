// Validación en el navegador y armado del envío a partir de la definición de
// la plantilla. El servidor vuelve a validar todo (ver server/src/catalogo).

const NUMERICOS = ["numero", "moneda", "porcentaje"];
const vacio = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

export function todosLosCampos(plantilla) {
  return [...plantilla.camposComunes, ...plantilla.campos];
}

function errorCampo(campo, valor) {
  if (campo.tipo === "siNo") return null;
  if (vacio(valor)) return campo.requerido ? "Este dato es obligatorio." : null;

  if (NUMERICOS.includes(campo.tipo)) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return "Ingresa un número.";
    if (campo.tipo === "moneda" && (n < 0 || !Number.isInteger(n))) return "Ingresa un monto entero en pesos, sin puntos.";
    if (campo.tipo === "porcentaje" && (n < 0 || n > 100)) return "Debe estar entre 0 y 100.";
    if (campo.tipo === "numero" && !Number.isInteger(n)) return "Ingresa un número entero.";
    if (campo.min !== undefined && n < campo.min) return `Debe ser al menos ${campo.min}.`;
    if (campo.max !== undefined && n > campo.max) return `No puede superar ${campo.max}.`;
  }
  if (campo.tipo === "texto" && valor.length > 300) return "Es demasiado largo (máximo 300 caracteres).";
  if (campo.tipo === "textoLargo" && valor.length > 5000) return "Es demasiado largo (máximo 5000 caracteres).";
  return null;
}

export function validarFormulario(plantilla, valores) {
  const errores = {};
  for (const campo of todosLosCampos(plantilla)) {
    const e = errorCampo(campo, valores[campo.nombre]);
    if (e) errores[campo.nombre] = e;
  }

  if (vacio(valores.fechaTermino)) {
    if (plantilla.fechaTermino?.requerida) errores.fechaTermino = "Este dato es obligatorio.";
  } else if (!vacio(valores.fechaInicio) && valores.fechaTermino < valores.fechaInicio) {
    errores.fechaTermino = "No puede ser anterior a la fecha de inicio.";
  }
  return errores;
}

// Convierte los valores del formulario al formato que espera la API
export function armarEnvio(plantilla, valores) {
  const datos = {};
  for (const campo of todosLosCampos(plantilla)) {
    const v = valores[campo.nombre];
    if (campo.tipo === "siNo") {
      datos[campo.nombre] = v === true;
    } else if (!vacio(v)) {
      datos[campo.nombre] = NUMERICOS.includes(campo.tipo) ? Number(v) : String(v).trim();
    }
  }
  return {
    tipo: plantilla.tipo,
    datos,
    modalidad: valores.modalidad || null,
    fechaTermino: valores.fechaTermino || null
  };
}

// Primer campo con error, en el orden en que aparecen en el formulario
export function primerError(plantilla, errores) {
  const orden = [...todosLosCampos(plantilla).map((c) => c.nombre), "modalidad", "fechaTermino"];
  return orden.find((n) => errores[n]) ?? Object.keys(errores)[0];
}

// Campos de la sección «Condiciones», comunes a todas las plantillas
function camposCondiciones(plantilla) {
  return [
    {
      nombre: "modalidad",
      etiqueta: "Modalidad",
      tipo: "seleccion",
      opciones: Object.entries(plantilla.modalidades).map(([valor, texto]) => ({ valor, texto })),
      ayuda: "Ejecución inmediata: las obligaciones se cumplen de una vez. Tracto sucesivo: se cumplen en el tiempo (pagos o servicios periódicos)."
    },
    {
      nombre: "fechaTermino",
      etiqueta: plantilla.fechaTermino?.etiqueta ?? "Fecha de término",
      tipo: "fecha",
      requerido: Boolean(plantilla.fechaTermino?.requerida),
      ayuda: plantilla.fechaTermino?.requerida ? undefined : "Déjala vacía si el contrato no tiene fecha de término."
    }
  ];
}

// Secciones en que se muestra y completa un contrato
export function seccionesPlantilla(plantilla) {
  return [
    { titulo: "Datos generales", campos: plantilla.camposComunes },
    { titulo: "Datos del contrato", campos: plantilla.campos },
    { titulo: "Condiciones", campos: camposCondiciones(plantilla) }
  ];
}

// Valores del formulario a partir de un contrato guardado
export function valoresDesdeContrato(contrato) {
  return {
    ...contrato.datos,
    modalidad: contrato.modalidad ?? "",
    fechaTermino: contrato.fechaTermino ? contrato.fechaTermino.slice(0, 10) : ""
  };
}
