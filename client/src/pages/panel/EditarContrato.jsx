import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Info } from "lucide-react";
import { obtenerUsuario } from "../../auth/sesion";
import { editarContrato, obtenerContrato } from "../../services/contratos";
import { obtenerPlantilla } from "../../services/plantillas";
import { crearSolicitud, listarSolicitudes } from "../../services/solicitudes";
import { editableSinSolicitud, requiereSolicitud } from "../../components/contratos/estados";
import {
  armarEnvio, primerError, seccionesPlantilla, validarFormulario, valoresDesdeContrato
} from "../../components/contratos/datosPlantilla";
import { SeccionesFormulario, tarjeta } from "../../components/contratos/SeccionesContrato";
import { nombreCompleto } from "../../utils/formato";
import useConfirmar from "../../components/ui/useConfirmar";
import useTitulo from "../../utils/useTitulo";

// Edición directa (antes de cualquier firma) o, si el contrato ya tiene firmas,
// solicitud de edición con la versión propuesta para que la contraparte la apruebe.
export default function EditarContrato() {
  useTitulo("Editar contrato");
  const confirmar = useConfirmar();
  const { id } = useParams();
  const navigate = useNavigate();
  const usuario = obtenerUsuario();

  const [contrato, setContrato] = useState(null);
  const [plantilla, setPlantilla] = useState(null);
  const [hayPendiente, setHayPendiente] = useState(false);
  const [valores, setValores] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [errores, setErrores] = useState({});
  const [errorCarga, setErrorCarga] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerContrato(id)
      .then(async (c) => {
        const [p, s] = await Promise.all([obtenerPlantilla(c.tipo), listarSolicitudes(c.id)]);
        setPlantilla(p);
        setHayPendiente(s.some((x) => x.estado === "PENDIENTE"));
        setContrato(c);
        setValores(valoresDesdeContrato(c));
      })
      .catch((err) =>
        setErrorCarga(
          err.response?.status === 404 ? "Este contrato no existe."
            : err.response?.status === 403 ? "No tienes permiso para ver este contrato."
              : "No se pudo cargar el contrato."
        )
      );
  }, [id]);

  const secciones = useMemo(() => (plantilla ? seccionesPlantilla(plantilla) : []), [plantilla]);

  if (errorCarga) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-red-600 mb-4">{errorCarga}</p>
        <Link to="/panel/contratos" className="text-blue-700 hover:underline">Volver a mis contratos</Link>
      </div>
    );
  }
  if (!contrato || !valores) return <p className="text-gray-600">Cargando contrato…</p>;

  const esSolicitante = contrato.solicitanteId === usuario.id;
  const modoSolicitud = esSolicitante && requiereSolicitud(contrato);
  const motivoNoEditable = !esSolicitante
    ? "Solo el solicitante puede editar este contrato."
    : modoSolicitud && hayPendiente
      ? "Ya hay una solicitud pendiente para este contrato. Espera la respuesta de la contraparte o cancélala desde el detalle."
      : !modoSolicitud && !editableSinSolicitud(contrato)
        ? "Este contrato no se puede editar: fue rechazado o eliminado."
        : null;

  if (motivoNoEditable) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-gray-700 mb-4">{motivoNoEditable}</p>
        <Link to={`/panel/contrato/${contrato.id}`} className="text-blue-700 hover:underline">Ver el contrato</Link>
      </div>
    );
  }

  const titulo = contrato.tipo === "CONTRATO_SIMPLE" && contrato.datos.titulo ? contrato.datos.titulo : plantilla.nombre;

  const cambiar = (nombre, valor) => {
    setValores((v) => ({ ...v, [nombre]: valor }));
    if (errores[nombre]) setErrores((e) => ({ ...e, [nombre]: undefined }));
  };

  const enfocar = (nombre) => requestAnimationFrame(() => document.getElementById(`campo-${nombre}`)?.focus());

  const guardar = async (e) => {
    e.preventDefault();
    setErrorEnvio("");
    const nuevos = validarFormulario(plantilla, valores);
    if (modoSolicitud && !motivo.trim()) nuevos.motivo = "Explica a la contraparte por qué propones estos cambios.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      enfocar(nuevos.motivo && Object.keys(nuevos).length === 1 ? "motivo" : primerError(plantilla, nuevos));
      return;
    }
    if (
      !modoSolicitud &&
      contrato.estado === "ACEPTADO" &&
      !(await confirmar({
        titulo: "Guardar cambios",
        mensaje: `${nombreCompleto(contrato.contraparte)} ya aceptó este contrato. Si guardas cambios, deberá revisarlo y aceptarlo nuevamente.`,
        confirmar: "Guardar cambios"
      }))
    ) {
      return;
    }

    setGuardando(true);
    try {
      const { datos, modalidad, fechaTermino } = armarEnvio(plantilla, valores);
      let mensaje;
      if (modoSolicitud) {
        const s = await crearSolicitud(contrato.id, { tipo: "EDICION", motivo: motivo.trim(), datos, modalidad, fechaTermino });
        mensaje = `Enviaste la solicitud de edición (${s.cambios.join(", ")}). La contraparte debe aprobarla.`;
      } else {
        const r = await editarContrato(contrato.id, { datos, modalidad, fechaTermino });
        mensaje = r.cambios.length === 0 ? "No hubo cambios que guardar." : `Cambios guardados: ${r.cambios.join(", ")}.`;
      }
      navigate(`/panel/contrato/${contrato.id}`, { replace: true, state: { mensaje } });
    } catch (err) {
      setErrorEnvio(err.response?.data?.error || "No se pudieron guardar los cambios.");
      if (err.response?.data?.errores) {
        setErrores(err.response.data.errores);
        enfocar(primerError(plantilla, err.response.data.errores));
      }
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-sm text-green-600 font-semibold">{modoSolicitud ? "Solicitar edición" : "Editar contrato"}</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1 break-words">{titulo}</h1>
      <p className="text-gray-600 mt-1 mb-6">Contraparte: {nombreCompleto(contrato.contraparte)} ({contrato.contraparte.email})</p>

      <div className="space-y-6">
        {modoSolicitud ? (
          <p className="flex gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-gray-700">
            <Info size={18} className="shrink-0 text-blue-700" />
            Este contrato ya tiene firmas. Modifica los datos que quieras cambiar: la contraparte verá la versión propuesta y,
            si la aprueba, ambas partes deberán volver a firmar. Hasta entonces, el contrato actual sigue vigente.
          </p>
        ) : (
          contrato.estado === "ACEPTADO" && (
            <p className="flex gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-gray-700">
              <Info size={18} className="shrink-0 text-blue-700" />
              La contraparte ya aceptó este contrato. Si guardas cambios, volverá a quedar pendiente de su revisión.
            </p>
          )
        )}

        {plantilla.advertencia && (
          <p className="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle size={18} className="shrink-0" />
            {plantilla.advertencia}
          </p>
        )}

        {errorEnvio && <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{errorEnvio}</p>}

        <form onSubmit={guardar} noValidate className="space-y-6">
          <SeccionesFormulario secciones={secciones} valores={valores} errores={errores} onChange={cambiar} />

          {modoSolicitud && (
            <fieldset className={tarjeta}>
              <legend className="px-2 -ml-2 font-semibold text-gray-800">Motivo de la solicitud</legend>
              <label htmlFor="campo-motivo" className="block text-sm font-medium mb-1 mt-2">
                ¿Por qué propones estos cambios? <span className="text-red-600">*</span>
              </label>
              <textarea
                id="campo-motivo"
                rows={3}
                maxLength={1000}
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (errores.motivo) setErrores((x) => ({ ...x, motivo: undefined }));
                }}
                aria-invalid={Boolean(errores.motivo)}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none ${errores.motivo ? "border-red-400" : "border-gray-300"}`}
              />
              {errores.motivo && <p className="mt-1 text-xs text-red-600">{errores.motivo}</p>}
            </fieldset>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link
              to={`/panel/contrato/${contrato.id}`}
              className="text-center px-5 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-60"
            >
              {guardando ? "Enviando…" : modoSolicitud ? "Enviar solicitud de edición" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
