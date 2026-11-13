import { Link } from "react-router-dom";
import { obtenerUsuario } from "../auth/sesion";
import useTitulo from "../utils/useTitulo";

export default function NoEncontrada() {
  useTitulo("Página no encontrada");
  const destino = obtenerUsuario() ? { to: "/panel", texto: "Volver a mi panel" } : { to: "/", texto: "Volver al inicio" };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
      <div className="bg-white rounded-2xl border-2 border-green-400 shadow-sm p-8 text-center max-w-md">
        <p className="text-5xl font-bold text-blue-800">404</p>
        <h1 className="text-xl font-semibold text-gray-800 mt-2">Página no encontrada</h1>
        <p className="text-gray-600 mt-2">La dirección que buscas no existe o fue movida.</p>
        <Link to={destino.to} className="inline-block mt-6 px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
          {destino.texto}
        </Link>
      </div>
    </div>
  );
}
