import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye, FileImage, FileSpreadsheet, FileText, Lock, Paperclip, Trash2, Upload } from "lucide-react";
import { tarjeta } from "./SeccionesContrato";
import Dialogo from "../ui/Dialogo";
import { eliminarDocumento, listarDocumentos, obtenerArchivo, subirDocumento } from "../../services/documentos";
import { formatearFechaHora, nombreCompleto } from "../../utils/formato";
import useConfirmar from "../ui/useConfirmar";

const EXTENSIONES = ".pdf,.jpg,.jpeg,.png,.docx,.xlsx";
const PERMITIDAS = /\.(pdf|jpe?g|png|docx|xlsx)$/i;

function tamanoLegible(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function iconoDocumento(mime) {
  if (mime.startsWith("image/")) return FileImage;
  if (mime.includes("spreadsheet")) return FileSpreadsheet;
  return FileText;
}

// Mensaje de error del servidor; con responseType "blob" viene como Blob
async function mensajeError(err, porDefecto) {
  const datos = err.response?.data;
  if (datos instanceof Blob) {
    try {
      return JSON.parse(await datos.text()).error || porDefecto;
    } catch {
      return porDefecto;
    }
  }
  return datos?.error || porDefecto;
}

// Documentos adjuntos del contrato. onCambio recarga el contrato (su huella
// incluye los documentos) y el historial.
export default function DocumentosContrato({ contrato, usuario, onCambio }) {
  const confirmar = useConfirmar();
  const [info, setInfo] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [visor, setVisor] = useState(null); // { doc, url }
  const entrada = useRef(null);

  const cargar = useCallback(() => {
    listarDocumentos(contrato.id).then(setInfo).catch(() => setError("No se pudieron cargar los documentos."));
  }, [contrato.id]);

  // También se recarga cuando el contrato cambia (p. ej. tras una firma)
  useEffect(() => {
    cargar();
  }, [cargar, contrato.updatedAt, contrato.estado]);

  if (!info) return null;
  const { documentos, editables, maximo, maxBytes } = info;
  const lleno = documentos.length >= maximo;

  const elegir = (e) => {
    const f = e.target.files?.[0] ?? null;
    setError("");
    setMensaje("");
    if (f && !PERMITIDAS.test(f.name)) {
      setError("Tipo de archivo no permitido. Usa PDF, JPG, PNG, DOCX o XLSX.");
      e.target.value = "";
      return;
    }
    if (f && f.size > maxBytes) {
      setError("El archivo supera el máximo de 10 MB.");
      e.target.value = "";
      return;
    }
    setArchivo(f);
  };

  const subir = async (e) => {
    e.preventDefault();
    if (!archivo) return setError("Selecciona un archivo.");
    setError("");
    setProgreso(0);
    try {
      const doc = await subirDocumento(contrato.id, archivo, descripcion.trim(), setProgreso);
      setMensaje(`Se adjuntó «${doc.nombre}».`);
      setArchivo(null);
      setDescripcion("");
      if (entrada.current) entrada.current.value = "";
      cargar();
      onCambio();
    } catch (err) {
      setError(await mensajeError(err, "No se pudo adjuntar el documento."));
    } finally {
      setProgreso(null);
    }
  };

  // «Ver» muestra el documento dentro de la aplicación (sin ventanas emergentes);
  // «Descargar» lo guarda con su nombre original.
  const abrir = async (doc, ver) => {
    setError("");
    try {
      const blob = await obtenerArchivo(contrato.id, doc.id, ver);
      const url = URL.createObjectURL(new Blob([blob], { type: doc.mimeType }));
      if (ver) {
        setVisor({ doc, url });
      } else {
        const enlace = document.createElement("a");
        enlace.href = url;
        enlace.download = doc.nombre;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (err) {
      setError(await mensajeError(err, "No se pudo obtener el documento."));
    }
  };

  const cerrarVisor = () => {
    if (visor) URL.revokeObjectURL(visor.url);
    setVisor(null);
  };

  const eliminar = async (doc) => {
    const ok = await confirmar({
      titulo: "Eliminar documento",
      mensaje: `¿Eliminar «${doc.nombre}» de este contrato?`,
      confirmar: "Eliminar",
      peligro: true
    });
    if (!ok) return;
    setError("");
    try {
      await eliminarDocumento(contrato.id, doc.id);
      setMensaje(`Se eliminó «${doc.nombre}».`);
      cargar();
      onCambio();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo eliminar el documento.");
    }
  };

  return (
    <section className={tarjeta}>
      <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-1">
        <Paperclip size={20} className="text-blue-700" /> Documentos adjuntos
        <span className="text-sm font-normal text-gray-500">({documentos.length}/{maximo})</span>
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {editables
          ? "Ambas partes pueden adjuntar documentos de respaldo mientras nadie firme. Al firmar, la firma cubre también estos documentos."
          : (
            <span className="inline-flex items-center gap-1"><Lock size={14} /> Los documentos quedaron fijos: el contrato ya tiene firmas o no admite cambios.</span>
          )}
      </p>

      {mensaje && <p role="status" className="mb-3 p-3 rounded-lg bg-green-50 border border-green-400 text-sm text-green-800">{mensaje}</p>}
      {error && <p role="alert" className="mb-3 p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{error}</p>}

      {documentos.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No hay documentos adjuntos.</p>
      ) : (
        <ul className="divide-y divide-gray-100 mb-4">
          {documentos.map((doc) => {
            const Icono = iconoDocumento(doc.mimeType);
            const visible = /^(application\/pdf|image\/)/.test(doc.mimeType);
            return (
              <li key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <Icono size={28} className="shrink-0 text-blue-700" />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-gray-800 break-all">{doc.nombre}</p>
                    {doc.descripcion && <p className="text-gray-600 break-words">{doc.descripcion}</p>}
                    <p className="text-xs text-gray-500">
                      {tamanoLegible(doc.tamano)} · {nombreCompleto(doc.usuario)} · {formatearFechaHora(doc.fecha)}
                    </p>
                    <p className="text-xs text-gray-400 break-all" title="Huella SHA-256 del archivo">SHA-256: {doc.hash}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 shrink-0">
                  {visible && (
                    <button type="button" onClick={() => abrir(doc, true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 rounded-lg hover:bg-blue-50">
                      <Eye size={16} /> Ver
                    </button>
                  )}
                  <button type="button" onClick={() => abrir(doc, false)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 rounded-lg hover:bg-blue-50">
                    <Download size={16} /> Descargar
                  </button>
                  {editables && doc.usuarioId === usuario.id && (
                    <button type="button" onClick={() => eliminar(doc)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 rounded-lg hover:bg-red-50">
                      <Trash2 size={16} /> Eliminar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editables && !lleno && (
        <form onSubmit={subir} className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-300 space-y-3">
          <div>
            <label htmlFor="documento-archivo" className="block text-sm font-medium mb-1">Archivo</label>
            <input
              ref={entrada}
              id="documento-archivo"
              type="file"
              accept={EXTENSIONES}
              onChange={elegir}
              className="block w-full text-sm text-gray-700 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-700 file:text-white file:font-semibold hover:file:bg-blue-800"
            />
            <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG, DOCX o XLSX. Máximo 10 MB.</p>
          </div>
          <div>
            <label htmlFor="documento-descripcion" className="block text-sm font-medium mb-1">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="documento-descripcion"
              type="text"
              maxLength={200}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ejemplo: copia de la cédula de identidad"
              className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          {progreso !== null && (
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-green-500 transition-all" style={{ width: `${progreso}%` }} />
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!archivo || progreso !== null}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-60"
            >
              <Upload size={18} /> {progreso !== null ? `Subiendo… ${progreso}%` : "Adjuntar documento"}
            </button>
          </div>
        </form>
      )}
      {editables && lleno && <p className="text-sm text-gray-500">Se alcanzó el máximo de {maximo} documentos.</p>}

      <Dialogo abierto={Boolean(visor)} titulo={visor?.doc.nombre ?? ""} onCerrar={cerrarVisor} ancho="max-w-4xl">
        {visor && (
          <div className="space-y-3">
            {visor.doc.mimeType.startsWith("image/") ? (
              <img src={visor.url} alt={visor.doc.descripcion || visor.doc.nombre} className="max-h-[70vh] mx-auto rounded-lg" />
            ) : (
              <iframe src={visor.url} title={visor.doc.nombre} className="w-full h-[70vh] rounded-lg border border-gray-200" />
            )}
            <div className="flex justify-end">
              <button type="button" onClick={() => abrir(visor.doc, false)} className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-blue-700 rounded-lg hover:bg-blue-50">
                <Download size={16} /> Descargar
              </button>
            </div>
          </div>
        )}
      </Dialogo>
    </section>
  );
}
