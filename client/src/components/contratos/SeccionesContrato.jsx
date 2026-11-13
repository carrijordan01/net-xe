import CampoPlantilla from "./CampoPlantilla";
import { formatearValor } from "../../utils/formato";

export const tarjeta = "bg-white rounded-2xl border-2 border-green-400 shadow-sm p-5 sm:p-6";

// Secciones editables del formulario de un contrato
export function SeccionesFormulario({ secciones, valores, errores, onChange }) {
  return secciones.map((s) => (
    <fieldset key={s.titulo} className={tarjeta}>
      <legend className="px-2 -ml-2 font-semibold text-gray-800">{s.titulo}</legend>
      <div className="grid gap-4 sm:grid-cols-2 mt-2">
        {s.campos.map((c) => (
          <CampoPlantilla key={c.nombre} campo={c} valor={valores[c.nombre]} error={errores[c.nombre]} onChange={onChange} />
        ))}
      </div>
    </fieldset>
  ));
}

// Las mismas secciones, en modo solo lectura
export function SeccionesResumen({ secciones, valores, modalidades }) {
  return secciones.map((s) => (
    <section key={s.titulo} className={tarjeta}>
      <h2 className="font-semibold text-gray-800 mb-3">{s.titulo}</h2>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {s.campos.map((c) => {
          const esModalidad = c.nombre === "modalidad";
          const valor = esModalidad ? modalidades[valores.modalidad] : valores[c.nombre];
          return (
            <div key={c.nombre} className={c.tipo === "textoLargo" ? "sm:col-span-2" : undefined}>
              <dt className="text-gray-500">{c.etiqueta}</dt>
              <dd className="text-gray-800 whitespace-pre-wrap break-words">
                {formatearValor(esModalidad ? { tipo: "texto" } : c, valor)}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  ));
}
