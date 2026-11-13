import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle2, Clock, Fingerprint, Info, PenLine, Pencil, ShieldAlert,
  ShieldCheck, Trash2, UserRound, XCircle, FilePen, FileX2, Download
} from "lucide-react";
import { obtenerUsuario } from "../../auth/sesion";
import {
  aceptarContrato, descargarPDF, eliminarContrato, obtenerContrato, obtenerHistorial, rechazarContrato
} from "../../services/contratos";
import { obtenerPlantilla } from "../../services/plantillas";
import { ESTADOS, editableSinSolicitud, requiereSolicitud } from "../../components/contratos/estados";
import SolicitudesContrato from "../../components/contratos/SolicitudesContrato";
import { crearSolicitud, listarSolicitudes } from "../../services/solicitudes";
import { seccionesPlantilla, valoresDesdeContrato } from "../../components/contratos/datosPlantilla";
import { SeccionesResumen, tarjeta } from "../../components/contratos/SeccionesContrato";
import HistorialContrato from "../../components/contratos/HistorialContrato";
import DocumentosContrato from "../../components/contratos/DocumentosContrato";
import DialogoFirma from "../../components/contratos/DialogoFirma";
import Dialogo from "../../components/ui/Dialogo";
import { formatearFechaHora, nombreCompleto } from "../../utils/formato";
import useConfirmar from "../../components/ui/useConfirmar";
import useTitulo from "../../utils/useTitulo";

const botonPrimario =
  "inline-flex items-center justify-center gap-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-60";
const botonSecundario =
  "inline-flex items-center justify-center gap-1 px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition disabled:opacity-60";
const botonPeligro =
  "inline-flex items-center justify-center gap-1 px-4 py-2 font-semibold text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-60";

// Mensaje de situación del contrato según su estado y el rol de quien lo mira
function situacion(contrato, esSolicitante) {
  const otra = nombreCompleto(esSolicitante ? contrato.contraparte : contrato.solicitante);
  const yoFirme = esSolicitante ? contrato.firmadoSolicitante : contrato.firmadoContraparte;
  const otraFirmo = esSolicitante ? contrato.firmadoContraparte : contrato.firmadoSolicitante;
  switch (contrato.estado) {
    case "PENDIENTE":
      return esSolicitante
        ? `Esperando que ${otra} revise el contrato y lo acepte o rechace.`
        : `${otra} te ofreció este contrato. Revísalo con calma antes de aceptarlo o rechazarlo.`;
    case "ACEPTADO":
      if (yoFirme) return `Ya firmaste. Falta la firma de ${otra}.`;
      if (otraFirmo) return `${otra} ya firmó. Falta tu firma para completar el contrato.`;
      return esSolicitante
        ? `${otra} aceptó el contrato. Ya pueden firmarlo ambas partes.`
        : "Aceptaste el contrato. Ya pueden firmarlo ambas partes.";
    case "RECHAZADO":
      return esSolicitante ? `${otra} rechazó este contrato.` : "Rechazaste este contrato.";
    case "FIRMADO":
      return "El contrato está firmado por ambas partes.";
    case "ELIMINADO":
      return esSolicitante
        ? "Eliminaste este contrato. Se conserva solo para consulta."
        : `${otra} eliminó este contrato. Se conserva solo para consulta.`;
    default:
      return "";
  }
}

function Parte({ titulo, usuario, esYo, firmado, fechaFirma, ipFirma, huellaFirma, huellaActual }) {
  const integra = huellaFirma && huellaFirma === huellaActual;
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{titulo}{esYo && " (tú)"}</p>
      <p className="font-semibold text-gray-800">{nombreCompleto(usuario)}</p>
      <p className="text-sm text-gray-600 break-all">{usuario.email}</p>
      <p className={`mt-2 text-sm flex items-center gap-1 ${firmado ? "text-green-700" : "text-gray-500"}`}>
        {firmado ? <Check size={16} /> : <Clock size={16} />}
        {firmado ? `Firmó el ${formatearFechaHora(fechaFirma)}` : "Aún no firma"}
      </p>
      {firmado && (
        <div className="mt-1 text-xs text-gray-500 space-y-0.5">
          {ipFirma && <p>Desde la IP {ipFirma}</p>}
          {huellaFirma ? (
            <p className={`flex items-center gap-1 ${integra ? "text-green-700" : "text-red-600"}`}>
              {integra ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {integra ? "El contenido coincide con lo firmado" : "El contenido NO coincide con lo firmado"}
            </p>
          ) : (
            <p>Firma sin huella registrada (anterior a la firma con PIN).</p>
          )}
        </div>
      )}
      {!esYo && (
        <Link to={`/panel/usuarios/${usuario.id}`} className="mt-2 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
          <UserRound size={16} /> Ver perfil
        </Link>
      )}
    </div>
  );
}

export default function DetalleContrato() {
  useTitulo("Detalle del contrato");
  const confirmar = useConfirmar();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = obtenerUsuario();

  const [contrato, setContrato] = useState(null);
  const [plantilla, setPlantilla] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState(location.state?.mensaje ?? "");
  const [procesando, setProcesando] = useState(false);
  const [dialogo, setDialogo] = useState(null); // "firma" | "rechazo" | "solicitarEliminacion"
  const [motivo, setMotivo] = useState("");
  const [solicitudes, setSolicitudes] = useState([]);
  const [descargando, setDescargando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const c = await obtenerContrato(id);
      const [p, h, s] = await Promise.all([obtenerPlantilla(c.tipo), obtenerHistorial(id), listarSolicitudes(id)]);
      setContrato(c);
      setPlantilla(p);
      setHistorial(h);
      setSolicitudes(s);
    } catch (err) {
      const estado = err.response?.status;
      setError(
        estado === 404 ? "Este contrato no existe."
          : estado === 403 ? "No tienes permiso para ver este contrato."
            : "No se pudo cargar el contrato."
      );
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cerrarDialogo = useCallback(() => setDialogo(null), []);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/panel/contratos" className="text-blue-700 hover:underline">Volver a mis contratos</Link>
      </div>
    );
  }
  if (!contrato || !plantilla) return <p className="text-gray-600">Cargando contrato…</p>;

  const esSolicitante = contrato.solicitanteId === usuario.id;
  const estado = ESTADOS[contrato.estado];
  const titulo = contrato.tipo === "CONTRATO_SIMPLE" && contrato.datos.titulo ? contrato.datos.titulo : plantilla.nombre;
  const tieneFirmas = contrato.firmadoSolicitante || contrato.firmadoContraparte;
  const yoFirme = esSolicitante ? contrato.firmadoSolicitante : contrato.firmadoContraparte;

  const puedeModificar = esSolicitante && editableSinSolicitud(contrato);
  const puedeAceptar = !esSolicitante && contrato.estado === "PENDIENTE";
  const puedeRechazar = !esSolicitante && ["PENDIENTE", "ACEPTADO"].includes(contrato.estado) && !tieneFirmas;
  const pendiente = solicitudes.find((s) => s.estado === "PENDIENTE");
  const puedeFirmar = contrato.estado === "ACEPTADO" && !yoFirme && !pendiente;
  const puedeSolicitar = esSolicitante && requiereSolicitud(contrato) && !pendiente;
  const hayAcciones = puedeModificar || puedeAceptar || puedeRechazar || puedeFirmar || puedeSolicitar;

  // Ejecuta una acción, muestra su resultado y recarga el contrato
  const ejecutar = async (accion, textoExito) => {
    setProcesando(true);
    setErrorAccion("");
    try {
      await accion();
      setMensaje(textoExito);
      await cargar();
      window.scrollTo({ top: 0 });
    } catch (err) {
      setMensaje("");
      setErrorAccion(err.response?.data?.error || "No se pudo completar la acción.");
    } finally {
      setProcesando(false);
    }
  };

  const eliminar = async () => {
    const ok = await confirmar({
      titulo: "Eliminar contrato",
      mensaje: `¿Eliminar «${titulo}»? Quedará en la sección Eliminados solo para consulta y la contraparte ya no podrá aceptarlo.`,
      confirmar: "Eliminar",
      peligro: true
    });
    if (!ok) return;
    ejecutar(() => eliminarContrato(contrato.id), "Contrato eliminado.");
  };

  const aceptar = async () => {
    const ok = await confirmar({
      titulo: "Aceptar contrato",
      mensaje: `¿Aceptar «${titulo}»? Después, ambas partes podrán firmarlo.`,
      confirmar: "Aceptar contrato"
    });
    if (!ok) return;
    ejecutar(() => aceptarContrato(contrato.id), "Aceptaste el contrato. Ya puedes firmarlo.");
  };

  const rechazar = async (e) => {
    e.preventDefault();
    setDialogo(null);
    await ejecutar(() => rechazarContrato(contrato.id, motivo), "Rechazaste el contrato. El solicitante será notificado.");
    setMotivo("");
  };

  const descargar = async () => {
    setDescargando(true);
    setErrorAccion("");
    try {
      const { blob, nombre } = await descargarPDF(contrato.id);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setErrorAccion("No se pudo generar el PDF del contrato.");
    } finally {
      setDescargando(false);
    }
  };

  const solicitarEliminacion = async (e) => {
    e.preventDefault();
    setDialogo(null);
    await ejecutar(
      () => crearSolicitud(contrato.id, { tipo: "ELIMINACION", motivo }),
      "Enviaste la solicitud de eliminación. La contraparte debe aprobarla."
    );
    setMotivo("");
  };

  // Tras responder o cancelar una solicitud
  const alCambiarSolicitud = async (texto) => {
    setErrorAccion("");
    setMensaje(texto);
    await cargar();
    window.scrollTo({ top: 0 });
  };

  const alFirmar = async (r) => {
    setDialogo(null);
    setErrorAccion("");
    setMensaje(r.contrato.estado === "FIRMADO" ? "¡Listo! El contrato quedó firmado por ambas partes." : "Tu firma quedó registrada. Falta la firma de la otra parte.");
    await cargar();
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
        <ArrowLeft size={16} /> Volver
      </button>

      {mensaje && <p role="status" className="p-3 rounded-lg bg-green-50 border border-green-400 text-sm text-green-800">{mensaje}</p>}

      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${estado.clase}`}>{estado.texto}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mt-2 break-words">{titulo}</h1>
          {titulo !== plantilla.nombre && <p className="text-gray-600">{plantilla.nombre}</p>}
          <p className="text-sm text-gray-500 mt-1">
            Creado el {formatearFechaHora(contrato.createdAt)}
            {contrato.updatedAt !== contrato.createdAt && <> · Última modificación: {formatearFechaHora(contrato.updatedAt)}</>}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <button type="button" onClick={descargar} disabled={descargando} className={botonSecundario}>
            <Download size={18} /> {descargando ? "Generando…" : "Descargar PDF"}
          </button>
          {contrato.estado !== "FIRMADO" && (
            <p className="mt-1 text-xs text-gray-500 sm:max-w-[14rem]">Mientras no esté firmado, el PDF lleva una marca de borrador.</p>
          )}
        </div>
      </header>

      <p className="flex gap-2 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-gray-700">
        <Info size={18} className="shrink-0 text-blue-700" />
        {situacion(contrato, esSolicitante)}
      </p>

      {errorAccion && <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{errorAccion}</p>}

      {hayAcciones && (
        <div className={`${tarjeta} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
          <p className="text-sm text-gray-600">
            {puedeFirmar
              ? "Para firmar necesitarás tu contraseña y tu PIN de firma."
              : puedeAceptar
                ? "Revisa todos los datos antes de responder."
                : puedeSolicitar
                  ? "Este contrato ya tiene firmas. Para modificarlo o eliminarlo, envía una solicitud a la contraparte."
                  : "Mientras ninguna de las partes lo firme, puedes editarlo o eliminarlo."}
          </p>
          <div className="flex flex-wrap gap-2">
            {puedeFirmar && (
              <button type="button" onClick={() => setDialogo("firma")} disabled={procesando} className={botonPrimario}>
                <PenLine size={18} /> Firmar contrato
              </button>
            )}
            {puedeAceptar && (
              <button type="button" onClick={aceptar} disabled={procesando} className={botonPrimario}>
                <CheckCircle2 size={18} /> Aceptar
              </button>
            )}
            {puedeRechazar && (
              <button type="button" onClick={() => setDialogo("rechazo")} disabled={procesando} className={botonPeligro}>
                <XCircle size={18} /> Rechazar
              </button>
            )}
            {puedeModificar && (
              <>
                <Link to={`/panel/contrato/${contrato.id}/editar`} className={botonSecundario}>
                  <Pencil size={18} /> Editar
                </Link>
                <button type="button" onClick={eliminar} disabled={procesando} className={botonPeligro}>
                  <Trash2 size={18} /> Eliminar
                </button>
              </>
            )}
            {puedeSolicitar && (
              <>
                <Link to={`/panel/contrato/${contrato.id}/editar`} className={botonSecundario}>
                  <FilePen size={18} /> Solicitar edición
                </Link>
                <button type="button" onClick={() => setDialogo("solicitarEliminacion")} disabled={procesando} className={botonPeligro}>
                  <FileX2 size={18} /> Solicitar eliminación
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <SolicitudesContrato
        contrato={contrato}
        plantilla={plantilla}
        solicitudes={solicitudes}
        esSolicitante={esSolicitante}
        onCambio={alCambiarSolicitud}
        onError={setErrorAccion}
      />

      <section className={tarjeta}>
        <h2 className="font-semibold text-gray-800 mb-4">Partes y firmas</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Parte
            titulo="Solicitante"
            usuario={contrato.solicitante}
            esYo={esSolicitante}
            firmado={contrato.firmadoSolicitante}
            fechaFirma={contrato.fechaFirmaSolicitante}
            ipFirma={contrato.ipFirmaSolicitante}
            huellaFirma={contrato.firmaSolicitanteHash}
            huellaActual={contrato.hashContenido}
          />
          <Parte
            titulo="Contraparte"
            usuario={contrato.contraparte}
            esYo={!esSolicitante}
            firmado={contrato.firmadoContraparte}
            fechaFirma={contrato.fechaFirmaContraparte}
            ipFirma={contrato.ipFirmaContraparte}
            huellaFirma={contrato.firmaContraparteHash}
            huellaActual={contrato.hashContenido}
          />
        </div>
        <p className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-500">
          <Fingerprint size={14} className="shrink-0 mt-0.5" />
          <span>
            Huella SHA-256 del contenido actual: <code className="break-all text-gray-700">{contrato.hashContenido}</code>
          </span>
        </p>
      </section>

      {plantilla.advertencia && (
        <p className="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={18} className="shrink-0" />
          {plantilla.advertencia}
        </p>
      )}

      <SeccionesResumen
        secciones={seccionesPlantilla(plantilla)}
        valores={valoresDesdeContrato(contrato)}
        modalidades={plantilla.modalidades}
      />

      <DocumentosContrato contrato={contrato} usuario={usuario} onCambio={cargar} />

      <section className={tarjeta}>
        <h2 className="font-semibold text-gray-800 mb-4">Historial</h2>
        <HistorialContrato acciones={historial} />
      </section>

      <DialogoFirma
        abierto={dialogo === "firma"}
        contrato={contrato}
        titulo={titulo}
        onCerrar={cerrarDialogo}
        onFirmado={alFirmar}
      />

      <Dialogo abierto={dialogo === "solicitarEliminacion"} titulo="Solicitar eliminación" onCerrar={cerrarDialogo}>
        <form onSubmit={solicitarEliminacion} className="space-y-4">
          <p className="text-sm text-gray-700">
            «{titulo}» ya tiene firmas, por lo que la contraparte debe aprobar su eliminación. Si la aprueba, el contrato
            quedará eliminado y solo se conservará para consulta.
          </p>
          <div>
            <label htmlFor="motivo-eliminacion" className="block text-sm font-medium mb-1">Motivo *</label>
            <textarea
              id="motivo-eliminacion"
              rows={3}
              maxLength={1000}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Explica a la contraparte por qué quieres eliminar el contrato."
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={cerrarDialogo} className={botonSecundario}>Cancelar</button>
            <button
              type="submit"
              disabled={!motivo.trim()}
              className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-60"
            >
              <FileX2 size={18} /> Enviar solicitud
            </button>
          </div>
        </form>
      </Dialogo>

      <Dialogo abierto={dialogo === "rechazo"} titulo="Rechazar contrato" onCerrar={cerrarDialogo}>
        <form onSubmit={rechazar} className="space-y-4">
          <p className="text-sm text-gray-700">
            Al rechazar «{titulo}», el solicitante será notificado y el contrato ya no podrá firmarse.
          </p>
          <div>
            <label htmlFor="motivo-rechazo" className="block text-sm font-medium mb-1">
              Motivo <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="motivo-rechazo"
              rows={3}
              maxLength={1000}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Cuéntale al solicitante por qué no aceptas el contrato."
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button type="button" onClick={cerrarDialogo} className={botonSecundario}>Cancelar</button>
            <button type="submit" className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
              <XCircle size={18} /> Rechazar contrato
            </button>
          </div>
        </form>
      </Dialogo>
    </div>
  );
}
