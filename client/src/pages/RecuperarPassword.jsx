import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import AuthCard, { Alerta, inputClass } from "../components/auth/AuthCard";
import { solicitarRecuperacion } from "../services/recuperacion";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecuperarPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Ingresa un correo válido.");
      return;
    }
    setEnviando(true);
    try {
      const r = await solicitarRecuperacion(email.trim());
      setEnviado(r.message);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo procesar la solicitud. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <AuthCard titulo="Revisa tu correo">
        <div className="flex justify-center mb-4"><MailCheck size={40} className="text-green-500" /></div>
        <Alerta tipo="exito">{enviado}</Alerta>
        <p className="text-sm text-gray-600 mb-6">El enlace vence en 30 minutos y sirve una sola vez.</p>
        <Link
          to="/login"
          className="block w-full text-center py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600"
        >
          Volver a iniciar sesión
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      titulo="¿Olvidaste tu contraseña?"
      subtitulo="Ingresa el correo de tu cuenta y te enviaremos un enlace para elegir una nueva."
    >
      <Alerta>{error}</Alerta>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Correo electrónico*</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={inputClass}
            placeholder="nombre@correo.cl"
          />
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600 disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar enlace"}
        </button>
        <p className="text-center text-sm">
          <Link to="/login" className="text-blue-700 hover:underline">Volver a iniciar sesión</Link>
        </p>
      </form>
    </AuthCard>
  );
}
