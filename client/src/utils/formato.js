// Formato de valores para mostrar en pantalla (es-CL)

const pesos = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export function formatearFecha(valor) {
  if (!valor) return "";
  // Las fechas "AAAA-MM-DD" se muestran sin conversión de zona horaria
  const [a, m, d] = String(valor).slice(0, 10).split("-");
  return d && m && a ? `${d}-${m}-${a}` : String(valor);
}

export function formatearValor(campo, valor) {
  if (valor === undefined || valor === null || valor === "") return "—";
  switch (campo.tipo) {
    case "moneda":
      return pesos.format(Number(valor));
    case "porcentaje":
      return `${valor}%`;
    case "fecha":
      return formatearFecha(valor);
    case "siNo":
      return valor === true || valor === "true" ? "Sí" : "No";
    default:
      return String(valor);
  }
}

export const nombreCompleto = (u) => (u ? `${u.firstName} ${u.lastName}` : "");

export function formatearFechaHora(valor) {
  if (!valor) return "";
  return new Date(valor).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
}

// Fecha local (dd-mm-aaaa) de un instante, como createdAt. Para fechas de
// calendario guardadas como medianoche UTC (fechaTermino, campos «fecha») se usa
// formatearFecha, que no aplica zona horaria.
export function formatearFechaLocal(valor) {
  if (!valor) return "";
  const f = new Date(valor);
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(f.getDate())}-${dos(f.getMonth() + 1)}-${f.getFullYear()}`;
}
