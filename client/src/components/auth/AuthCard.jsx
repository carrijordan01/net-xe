import { Link } from "react-router-dom";
import logo from "../../assets/Net-Xe.png";
import useTitulo from "../../utils/useTitulo";

export const inputClass =
  "w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none";

// Contenedor común de las páginas de registro e inicio de sesión
export default function AuthCard({ titulo, subtitulo, ancho = "max-w-md", children }) {
  useTitulo(titulo);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-4 py-10">
      <Link to="/" className="mb-6" aria-label="Volver al inicio">
        <img src={logo} alt="Net-Xe" className="h-12 w-auto object-contain" />
      </Link>

      <div className={`w-full ${ancho} bg-white rounded-2xl shadow-md border-2 border-green-400 p-6 sm:p-8 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] bg-[size:20px_20px] opacity-40"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{titulo}</h2>
          {subtitulo && <p className="text-center text-sm text-gray-600 mb-6">{subtitulo}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function Alerta({ tipo = "error", children }) {
  if (!children) return null;
  const estilos = tipo === "exito"
    ? "bg-green-50 border-green-400 text-green-800"
    : "bg-red-50 border-red-300 text-red-700";
  return (
    <div role={tipo === "exito" ? "status" : "alert"} className={`mb-4 p-3 border rounded-lg text-sm ${estilos}`}>
      {children}
    </div>
  );
}
