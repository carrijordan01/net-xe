import { useEffect, useState } from "react";
import { obtenerNotificaciones, marcarLeida } from "../../services/notificaciones";

export default function NotificacionesCampana() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);

  const cargar = async () => {
    const data = await obtenerNotificaciones();
    setNotifs(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const unread = notifs.filter(n => !n.leido).length;

  const leer = async (id) => {
    await marcarLeida(id);
    cargar();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-2xl"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border rounded-xl shadow-lg p-3 z-50">
          <h3 className="font-bold mb-2">Notificaciones</h3>

          {notifs.length === 0 && (
            <p className="text-gray-500 text-sm">No hay notificaciones aún.</p>
          )}

          {notifs.map(n => (
            <div
              key={n.id}
              className={`p-2 mb-2 rounded ${
                n.leido ? "bg-gray-100" : "bg-blue-100"
              }`}
            >
              <p className="text-sm">{n.mensaje}</p>

              {!n.leido && (
                <button
                  onClick={() => leer(n.id)}
                  className="text-xs text-blue-600 mt-1"
                >
                  Marcar como leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
