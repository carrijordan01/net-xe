import { useCallback, useEffect, useState } from "react";
import { obtenerNotificaciones, marcarLeida, marcarTodasLeidas } from "../../services/notificaciones";

const INTERVALO_MS = 60_000;

// Notificaciones del usuario. Se actualizan cada minuto, al volver a la
// pestaña y al abrir la campana.
export default function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const r = await obtenerNotificaciones();
      setNotificaciones(r.notificaciones);
      setNoLeidas(r.noLeidas);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") cargar();
    }, INTERVALO_MS);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  const leer = async (id) => {
    const n = notificaciones.find((x) => x.id === id);
    if (!n || n.leido) return;
    setNotificaciones((prev) => prev.map((x) => (x.id === id ? { ...x, leido: true } : x)));
    setNoLeidas((c) => Math.max(0, c - 1));
    try {
      await marcarLeida(id);
    } catch {
      cargar();
    }
  };

  const leerTodas = async () => {
    setNotificaciones((prev) => prev.map((x) => ({ ...x, leido: true })));
    setNoLeidas(0);
    try {
      await marcarTodasLeidas();
    } catch {
      cargar();
    }
  };

  return { notificaciones, noLeidas, cargar, leer, leerTodas };
}
