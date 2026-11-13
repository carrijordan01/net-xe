import { useState } from "react";
import { CheckCircle2, FilePen, FileX2, XCircle } from "lucide-react";
import Dialogo from "../ui/Dialogo";
import { tarjeta } from "./SeccionesContrato";
import { ESTADOS_SOLICITUD } from "./estados";
import { seccionesPlantilla, valoresDesdeContrato } from "./datosPlantilla";
import { aprobarSolicitud, cancelarSolicitud, rechazarSolicitud } from "../../services/solicitudes";
import { formatearFechaHora, formatearValor, nombreCompleto } from "../../utils/formato";
import useConfirmar from "../ui/useConfirmar";

const botonSecundario =
  "inline-flex items-center justify-center gap-1 px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition disabled:opacity-60";

// Datos que cambian entre la versión actual y la propuesta, ya formateados
function diferencias(contrato, plantilla, propuesta) {
  const actual = valoresDesdeContrato(contrato);
  const nueva = valoresDesdeContrato({ datos: propuesta.datos, modalidad: propuesta.modalidad, fechaTermino: propuesta.fechaTermino });
  const filas = [];
  for (const seccion of seccionesPlantilla(plantilla)) {
    for (const campo of seccion.campos) {
      const formato = (valores) =>
        campo.nombre === "modalidad"
          ? plantilla.modalidades[valores.modalidad] ?? "—"
          : formatearValor(campo, valores[campo.nombre]);
      const antes = formato(actual);
      const despues = formato(nueva);
      if (antes !== despues) filas.push({ etiqueta: campo.etiqueta, antes, despues });
    }
  }
  return filas;
}

function TablaCambios({ filas }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2 pr-3 font-medium">Dato</th>
            <th className="py-2 pr-3 font-medium">Versión actual</th>
            <th className="py-2 font-medium">Versión propuesta</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.etiqueta} className="border-t border-gray-100 align-top">
              <td className="py-2 pr-3 text-gray-700">{f.etiqueta}</td>
              <td className="py-2 pr-3 text-gray-500 line-through decoration-red-400 whitespace-pre-wrap break-words">{f.antes}</td>
              <td className="py-2 text-gray-800 font-medium whitespace-pre-wrap break-words">{f.despues}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Solicitud pendiente (con sus acciones) y solicitudes anteriores de un contrato
export default function SolicitudesContrato({ contrato, plantilla, solicitudes, esSolicitante, onCambio, onError }) {
  const confirmar = useConfirmar();
  const [dialogo, setDialogo] = useState(null); // "aprobar" | "rechazar"
  const [respuesta, setRespuesta] = useState("");
  const [procesando, setProcesando] = useState(false);

  const pendiente = solicitudes.find((s) => s.estado === "PENDIENTE");
  const anteriores = solicitudes.filter((s) => s.estado !== "PENDIENTE");
  if (!pendiente && anteriores.length === 0) return null;

  const esEdicion = pendiente?.tipo === "EDICION";
  const cerrar = () => setDialogo(null);

  const ejecutar = async (accion, mensaje) => {
    setDialogo(null);
    setProcesando(true);
    try {
      await accion();
      await onCambio(mensaje);
    } catch (err) {
      onError(err.response?.data?.error || "No se pudo completar la acción.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      {pendiente && (
        <section className={`${tarjeta} border-amber-400`}>
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 shrink-0 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
              {esEdicion ? <FilePen size={20} /> : <FileX2 size={20} />}
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-800">
                Solicitud de {esEdicion ? "edición" : "eliminación"} pendiente
              </h2>
              <p className="text-sm text-gray-500">
                {nombreCompleto(pendiente.autor)} · {formatearFechaHora(pendiente.createdAt)}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-700"><b>Motivo:</b> {pendiente.motivo}</p>

          {esEdicion && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Cambios propuestos:</p>
              <TablaCambios filas={diferencias(contrato, plantilla, pendiente.propuesta)} />
            </div>
          )}

          <p className="mt-4 text-sm text-gray-600">
            {esSolicitante
              ? "La contraparte debe aprobar o rechazar la solicitud. Mientras tanto, el contrato no se puede firmar."
              : esEdicion
                ? "Si apruebas, el contrato tomará la versión propuesta y ambas partes deberán volver a firmarlo."
                : "Si apruebas, el contrato quedará eliminado y solo se conservará para consulta."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {esSolicitante ? (
              <button
                type="button"
                disabled={procesando}
                onClick={async () => {
                  const ok = await confirmar({
                    titulo: "Cancelar solicitud",
                    mensaje: "¿Cancelar esta solicitud? La contraparte ya no podrá responderla.",
                    confirmar: "Cancelar solicitud",
                    cancelar: "Volver",
                    peligro: true
                  });
                  if (ok) ejecutar(() => cancelarSolicitud(contrato.id, pendiente.id), "Cancelaste la solicitud.");
                }}
                className={botonSecundario}
              >
                Cancelar solicitud
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => setDialogo("aprobar")}
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-60"
                >
                  <CheckCircle2 size={18} /> Aprobar
                </button>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => setDialogo("rechazar")}
                  className="inline-flex items-center justify-center gap-1 px-4 py-2 font-semibold text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-60"
                >
                  <XCircle size={18} /> Rechazar
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {anteriores.length > 0 && (
        <section className={tarjeta}>
          <h2 className="font-semibold text-gray-800 mb-3">Solicitudes anteriores</h2>
          <ul className="space-y-3 text-sm">
            {anteriores.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-800">{s.tipo === "EDICION" ? "Edición" : "Eliminación"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADOS_SOLICITUD[s.estado].clase}`}>{ESTADOS_SOLICITUD[s.estado].texto}</span>
                  <span className="text-gray-500">{formatearFechaHora(s.createdAt)}</span>
                </span>
                <span className="text-gray-600">Motivo: {s.motivo}</span>
                {s.cambios.length > 0 && <span className="text-gray-600">Cambios: {s.cambios.join(", ")}</span>}
                {s.respuesta && <span className="text-gray-600">Respuesta: {s.respuesta}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialogo abierto={dialogo === "aprobar"} titulo={esEdicion ? "Aprobar la edición" : "Aprobar la eliminación"} onCerrar={cerrar}>
        <p className="text-sm text-gray-700">
          {esEdicion
            ? "El contrato tomará la versión propuesta. Las firmas actuales quedarán sin efecto y ambas partes deberán volver a firmar."
            : "El contrato quedará eliminado. Esta acción no se puede deshacer."}
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={cerrar} className={botonSecundario}>Volver</button>
          <button
            type="button"
            onClick={() =>
              ejecutar(
                () => aprobarSolicitud(contrato.id, pendiente.id),
                esEdicion ? "Aprobaste la edición. Ya pueden volver a firmar el contrato." : "Aprobaste la eliminación del contrato."
              )
            }
            className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
          >
            <CheckCircle2 size={18} /> Aprobar
          </button>
        </div>
      </Dialogo>

      <Dialogo abierto={dialogo === "rechazar"} titulo="Rechazar la solicitud" onCerrar={cerrar}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ejecutar(() => rechazarSolicitud(contrato.id, pendiente.id, respuesta), "Rechazaste la solicitud. El contrato se mantiene sin cambios.");
            setRespuesta("");
          }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-700">El contrato se mantendrá sin cambios y con sus firmas.</p>
          <div>
            <label htmlFor="respuesta-solicitud" className="block text-sm font-medium mb-1">
              Respuesta <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="respuesta-solicitud"
              rows={3}
              maxLength={1000}
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={cerrar} className={botonSecundario}>Volver</button>
            <button type="submit" className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
              <XCircle size={18} /> Rechazar solicitud
            </button>
          </div>
        </form>
      </Dialogo>
    </>
  );
}
