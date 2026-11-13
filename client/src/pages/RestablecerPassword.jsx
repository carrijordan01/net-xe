import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthCard, { Alerta, inputClass } from "../components/auth/AuthCard";
import { cerrarSesion } from "../auth/sesion";
import { restablecerPassword, validarEnlace } from "../services/recuperacion";

// Página del enlace enviado por correo: /restablecer?token=…
export default function RestablecerPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [enlace, setEnlace] = useState(null); // { valido, email } | { valido: false, error }
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    validarEnlace(token)
      .then(setEnlace)
      .catch((err) => setEnlace({ valido: false, error: err.response?.data?.error || "No se pudo verificar el enlace." }));
  }, [token]);

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    const nuevos = {};
    if (nueva.length < 8) nuevos.nueva = "Debe tener al menos 8 caracteres.";
    if (confirmacion !== nueva) nuevos.confirmacion = "Las contraseñas no coinciden.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const r = await restablecerPassword(token, nueva);
      // Si había una sesión abierta en este navegador, ya no es válida
      cerrarSesion();
      navigate("/login", { replace: true, state: { mensaje: r.message } });
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo actualizar la contraseña.");
      setEnviando(false);
    }
  };

  if (!enlace) {
    return <AuthCard titulo="Restablecer contraseña"><p className="text-center text-gray-600">Verificando el enlace…</p></AuthCard>;
  }

  if (!enlace.valido) {
    return (
      <AuthCard titulo="Enlace no válido">
        <Alerta>{enlace.error}</Alerta>
        <Link
          to="/recuperar"
          className="block w-full text-center py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600"
        >
          Solicitar un enlace nuevo
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard titulo="Elige una nueva contraseña" subtitulo={`Para la cuenta ${enlace.email}`}>
      <Alerta>{error}</Alerta>
      <form onSubmit={guardar} noValidate className="space-y-4">
        <div>
          <label htmlFor="nueva" className="block text-sm font-medium">Nueva contraseña*</label>
          <input
            id="nueva"
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
            placeholder="Mínimo 8 caracteres"
          />
          {errores.nueva && <p className="mt-1 text-xs text-red-600">{errores.nueva}</p>}
        </div>
        <div>
          <label htmlFor="confirmacion" className="block text-sm font-medium">Repite la nueva contraseña*</label>
          <input
            id="confirmacion"
            type="password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
          {errores.confirmacion && <p className="mt-1 text-xs text-red-600">{errores.confirmacion}</p>}
        </div>
        <p className="text-xs text-gray-500">Al cambiarla se cerrarán las sesiones abiertas en todos tus dispositivos.</p>
        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600 disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Guardar nueva contraseña"}
        </button>
      </form>
    </AuthCard>
  );
}
