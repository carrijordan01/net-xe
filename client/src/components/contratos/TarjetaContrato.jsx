import { Link } from "react-router-dom";
import { Check, Clock, Eye, Pencil, Trash2, UserRound } from "lucide-react";
import { ESTADOS, editableSinSolicitud, tituloContrato } from "./estados";
import { formatearFecha, formatearFechaLocal, nombreCompleto } from "../../utils/formato";

function Firma({ quien, firmado }) {
  return (
    <span className={`inline-flex items-center gap-1 ${firmado ? "text-green-700" : "text-gray-500"}`}>
      {firmado ? <Check size={14} /> : <Clock size={14} />}
      {quien} {firmado ? "firmó" : "sin firmar"}
    </span>
  );
}

// Tarjeta de un contrato con la otra parte y las acciones según el rol
export default function TarjetaContrato({ contrato, rol, catalogo, onEliminar }) {
  const esSolicitante = rol === "SOLICITANTE";
  const otraParte = esSolicitante ? contrato.contraparte : contrato.solicitante;
  const estado = ESTADOS[contrato.estado];
  const puedeModificar = esSolicitante && editableSinSolicitud(contrato);

  return (
    <article className="flex flex-col p-5 bg-white rounded-2xl border-2 border-green-400 shadow-sm">
      <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${estado.clase}`}>{estado.texto}</span>
      <h3 className="mt-2 font-semibold text-gray-800 break-words">{tituloContrato(contrato, catalogo)}</h3>

      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <div className="min-w-0">
          <p className="text-gray-500 text-xs">{esSolicitante ? "Contraparte" : "Solicitante"}</p>
          <p className="font-medium text-gray-800 truncate">{nombreCompleto(otraParte)}</p>
          <p className="text-gray-600 truncate">{otraParte.email}</p>
        </div>
        <Link
          to={`/panel/usuarios/${otraParte.id}`}
          className="shrink-0 inline-flex items-center gap-1 text-blue-700 hover:underline"
        >
          <UserRound size={16} /> Ver perfil
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <Firma quien="Solicitante" firmado={contrato.firmadoSolicitante} />
        <Firma quien="Contraparte" firmado={contrato.firmadoContraparte} />
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Creado el {formatearFechaLocal(contrato.createdAt)}
        {contrato.fechaTermino && <> · Vence el {formatearFecha(contrato.fechaTermino)}</>}
      </p>

      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
        <Link
          to={`/panel/contrato/${contrato.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition"
        >
          <Eye size={16} /> Revisar
        </Link>
        {puedeModificar && (
          <>
            <Link
              to={`/panel/contrato/${contrato.id}/editar`}
              className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-blue-700 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition"
            >
              <Pencil size={16} /> Editar
            </Link>
            <button
              type="button"
              onClick={() => onEliminar(contrato)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          </>
        )}
      </div>
    </article>
  );
}
