import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { guardarSesion } from "../auth/sesion";
import AuthCard, { Alerta, inputClass } from "../components/auth/AuthCard";

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    params.get("expirada") ? "Tu sesión expiró. Inicia sesión nuevamente." : ""
  );
  const [enviando, setEnviando] = useState(false);
  const mensaje = location.state?.mensaje;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setEnviando(true);
    try {
      const res = await api.post("/auth/login", { email: email.trim(), password });
      const { token, user } = res.data;
      guardarSesion(token, user);

      // Vuelve a la página protegida que se intentó abrir, o al panel
      const desde = location.state?.desde;
      navigate(desde?.startsWith("/panel") ? desde : "/panel", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo conectar con el servidor.");
      setEnviando(false);
    }
  };

  return (
    <AuthCard
      titulo="Iniciar sesión"
      subtitulo={
        <>
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="text-green-600 hover:underline font-semibold">
            Regístrate aquí
          </Link>
        </>
      }
    >
      {!error && <Alerta tipo="exito">{mensaje}</Alerta>}
      <Alerta>{error}</Alerta>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Correo electrónico*</label>
          <input
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={inputClass}
            placeholder="nombre@correo.cl"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">Contraseña*</label>
          <input
            id="password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
            placeholder="Ingrese su contraseña"
          />
          <div className="mt-1 text-right">
            <Link to="/recuperar" state={{ email: email.trim() }} className="text-sm text-blue-700 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enviando ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>
    </AuthCard>
  );
}

export default Login;
