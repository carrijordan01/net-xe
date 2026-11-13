import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CalendarClock, CheckCircle2, FileInput, FilePen, MessageSquareReply, Paperclip, Pencil, PenLine, Trash2, XCircle
} from "lucide-react";

const iconos = {
  CONTRATO_RECIBIDO: [FileInput, "text-blue-700 bg-blue-50"],
  CONTRATO_EDITADO: [Pencil, "text-blue-700 bg-blue-50"],
  CONTRATO_ELIMINADO: [Trash2, "text-red-600 bg-red-50"],
  CONTRATO_ACEPTADO: [CheckCircle2, "text-green-700 bg-green-50"],
  CONTRATO_RECHAZADO: [XCircle, "text-red-600 bg-red-50"],
  CONTRATO_FIRMADO: [PenLine, "text-green-700 bg-green-50"],
  VENCIMIENTO_PROXIMO: [CalendarClock, "text-amber-700 bg-amber-50"],
  SOLICITUD_CAMBIO: [FilePen, "text-amber-700 bg-amber-50"],
  SOLICITUD_RESPONDIDA: [MessageSquareReply, "text-blue-700 bg-blue-50"],
  DOCUMENTO_ADJUNTO: [Paperclip, "text-blue-700 bg-blue-50"]
};

function haceCuanto(fecha) {
  const minutos = Math.floor((Date.now() - new Date(fecha)) / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return dias === 1 ? "ayer" : `hace ${dias} días`;
  return new Date(fecha).toLocaleDateString("es-CL");
}

// Campana de notificaciones en pantalla. Recibe los datos desde el panel
// (useNotificaciones) para no repetir la consulta en cada instancia.
export default function NotificacionesCampana({ notificaciones, noLeidas, onLeer, onLeerTodas, onAbrir, alinear = "izquierda" }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!abierto) return;
    const cerrarFuera = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    const cerrarEsc = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEsc);
    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEsc);
    };
  }, [abierto]);

  const alternar = () => {
    if (!abierto) onAbrir?.();
    setAbierto(!abierto);
  };

  const abrirNotificacion = (n) => {
    onLeer(n.id);
    setAbierto(false);
    if (n.contratoId) navigate(`/panel/contrato/${n.contratoId}`);
  };

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={alternar}
        aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
        aria-expanded={abierto}
        className="relative p-2 rounded-lg text-white hover:bg-blue-800 transition"
      >
        <Bell size={22} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-red-600 text-white text-xs font-semibold rounded-full">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className={`absolute top-full mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white text-gray-800 border border-gray-200 rounded-xl shadow-lg z-50 ${
            alinear === "derecha" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold">Notificaciones</h3>
            {noLeidas > 0 && (
              <button type="button" onClick={onLeerTodas} className="text-xs text-blue-700 hover:underline">
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {notificaciones.length === 0 && (
              <p className="text-gray-500 text-sm px-2 py-4 text-center">No tienes notificaciones.</p>
            )}

            <ul className="space-y-1">
              {notificaciones.map((n) => {
                const [Icono, color] = iconos[n.tipo] ?? [Bell, "text-gray-600 bg-gray-100"];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => abrirNotificacion(n)}
                      className={`w-full text-left flex gap-3 p-2 rounded-lg transition hover:bg-gray-50 ${n.leido ? "" : "bg-blue-50/60"}`}
                    >
                      <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${color}`}>
                        <Icono size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm break-words ${n.leido ? "text-gray-600" : "text-gray-800 font-medium"}`}>
                          {n.mensaje}
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">{haceCuanto(n.createdAt)}</span>
                      </span>
                      {!n.leido && <span className="w-2 h-2 mt-2 shrink-0 rounded-full bg-blue-600" aria-label="Sin leer" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
