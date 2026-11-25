// Autocorrecciones básicas de texto, aplicadas al guardar contratos y datos de
// cuenta. Solo agregan mayúsculas (nunca las quitan, para respetar siglas como
// «SpA» o «IPC») y ordenan espacios. Espejo en client/src/utils/autocorreccion.js.
//
// Formatos (propiedad «formato» de un campo del catálogo):
//   · "oracion" (por defecto): mayúscula al inicio, tras punto seguido, «?» o
//     «!», y al comienzo de cada línea (punto aparte).
//   · "nombrePropio": mayúscula en cada palabra, salvo conectores (de, la, y…).
//   · "rut": 12345678k → 12.345.678-K.
//   · "ninguno": solo quita espacios sobrantes.

const LETRA_MINUSCULA = /\p{Ll}/u;

// Abreviaturas tras las cuales un punto no termina la oración
const ABREVIATURAS = new Set([
  "av", "avda", "sr", "sra", "srta", "sres", "dr", "dra", "etc", "n", "nº", "no", "núm", "num", "nro",
  "depto", "dpto", "of", "ej", "aprox", "art", "arts", "inc", "pág", "tel", "cía", "ltda", "vs", "km", "mts", "hrs"
]);

const CONECTORES = new Set(["de", "del", "la", "las", "los", "el", "y", "e", "o", "u", "en", "a", "al", "da", "do", "dos", "das", "van", "von"]);

const mayuscula = (letra) => letra.toLocaleUpperCase("es-CL");

// Espacios: uno solo entre palabras, ninguno antes de , ; : . ! ? ) y uno
// después de , ; cuando sigue una letra (no en «1,5») y antes de ¿ ¡. Máximo una línea en blanco.
function ordenarEspacios(texto) {
  return texto
    .split(/\r?\n/)
    .map((linea) =>
      linea
        .replace(/[ \t\xA0]+/g, " ")
        .trim()
        .replace(/ +([,;:.!?)»])/g, "$1")
        .replace(/([,;])(?=\p{L})/gu, "$1 ")
        .replace(/([.!?])(?=[¿¡])/g, "$1 ")
        .replace(/([(«¿¡]) +/g, "$1")
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ¿El punto que termina «palabra.» cierra la oración?
function cierraOracion(palabra) {
  const limpia = palabra.replace(/^[(«"']+/, "").toLocaleLowerCase("es-CL");
  if (limpia.endsWith("!") || limpia.endsWith("?")) return true;
  const sinPunto = limpia.slice(0, -1);
  if (/^\p{L}$/u.test(sinPunto)) return false; // inicial: «J. Pérez»
  if (/^(\p{L}\.)+\p{L}$/u.test(sinPunto)) return false; // sigla: «S.A.»
  return !ABREVIATURAS.has(sinPunto);
}

// Primera letra de «texto» en mayúscula, saltando viñetas, numeración y signos
// de apertura («- », «1. », «a) », «¿», «(»). Si antes aparece un dígito, no cambia.
function capitalizarInicio(texto) {
  const inicio = /^((?:[-•*]\s+|\d+[.)]\s+|\p{Ll}\)\s+)?[¿¡(«"']*)(\p{L})/u.exec(texto);
  if (!inicio || !LETRA_MINUSCULA.test(inicio[2])) return texto;
  return inicio[1] + mayuscula(inicio[2]) + texto.slice(inicio[0].length);
}

function corregirOracion(texto) {
  return ordenarEspacios(texto)
    .split("\n")
    .map((linea) => {
      const palabras = capitalizarInicio(linea).split(" ");
      for (let i = 1; i < palabras.length; i++) {
        const anterior = palabras[i - 1];
        if (/[.!?]$/.test(anterior) && cierraOracion(anterior)) palabras[i] = capitalizarInicio(palabras[i]);
      }
      return palabras.join(" ");
    })
    .join("\n");
}

function corregirNombrePropio(texto) {
  return ordenarEspacios(texto)
    .split(" ")
    .map((palabra, i) => {
      if (i > 0 && CONECTORES.has(palabra.toLocaleLowerCase("es-CL"))) return palabra;
      // Cada parte de un nombre compuesto con guion: «pérez-cotapos» → «Pérez-Cotapos»
      return palabra.replace(/(^|[-'’])(\p{Ll})/gu, (_, sep, letra) => sep + mayuscula(letra));
    })
    .join(" ");
}

function corregirRut(texto) {
  const limpio = texto.replace(/[.\s-]/g, "").toUpperCase();
  const partes = /^(\d{7,8})([\dK])$/.exec(limpio);
  if (!partes) return texto.trim();
  return `${partes[1].replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${partes[2]}`;
}

export function corregirTexto(texto, formato = "oracion") {
  if (typeof texto !== "string") return texto;
  switch (formato) {
    case "nombrePropio":
      return corregirNombrePropio(texto);
    case "rut":
      return corregirRut(texto);
    case "ninguno":
      return ordenarEspacios(texto);
    default:
      return corregirOracion(texto);
  }
}
