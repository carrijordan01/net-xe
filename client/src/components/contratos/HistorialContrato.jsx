import { Clock, FilePen, FilePlus2, Paperclip, PenLine, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { nombreRol } from "../../auth/sesion";
import { formatearFechaHora } from "../../utils/formato";

const iconos = [
  [/^solicitud/i, FilePen, "text-amber-700 bg-amber-50"],
  [/^documento adjuntado/i, Paperclip, "text-blue-700 bg-blue-50"],
  [/creado/i, FilePlus2, "text-green-600 bg-green-50"],
  [/editado/i, Pencil, "text-blue-700 bg-blue-50"],
  [/firmado/i, PenLine, "text-green-700 bg-green-50"],
  [/aceptado/i, CheckCircle2, "text-green-700 bg-green-50"],
  [/rechazado/i, XCircle, "text-red-600 bg-red-50"],
  [/eliminado/i, Trash2, "text-red-600 bg-red-50"]
];

function iconoEvento(evento) {
  const encontrado = iconos.find(([patron]) => patron.test(evento));
  return encontrado ? [encontrado[1], encontrado[2]] : [Clock, "text-gray-600 bg-gray-100"];
}

// Línea de tiempo de las acciones registradas sobre un contrato
export default function HistorialContrato({ acciones }) {
  if (acciones.length === 0) {
    return <p className="text-sm text-gray-500">Aún no hay acciones registradas.</p>;
  }

  return (
    <ol className="relative space-y-5 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
      {acciones.map((a) => {
        const [Icono, color] = iconoEvento(a.evento);
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className={`relative z-10 w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${color}`}>
              <Icono size={16} />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-medium text-gray-800">{a.evento}</p>
              <p className="text-gray-500">
                {a.usuario.firstName} {a.usuario.lastName} ({nombreRol(a.usuario.role)}) · {formatearFechaHora(a.fecha)}
              </p>
              {a.comentario && <p className="mt-1 text-gray-700 break-words">{a.comentario}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
