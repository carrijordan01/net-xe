import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "../assets/Net-Xe.png";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <header className="flex justify-between items-center px-6 md:px-12 py-4 border-b-4 border-blue-300 bg-white shadow-sm relative">
        <div className="flex items-center space-x-2">
          <img
            src={logo}
            alt="Net-Xe Logo"
            className="h-10 w-auto object-contain"
          />
        </div>

        <nav className="hidden md:flex space-x-4">
          <a
            href="/login"
            className="px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition"
          >
            Iniciar sesión
          </a>
          <a
            href="/register"
            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
          >
            Registrarse
          </a>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {menuOpen && (
          <div className="absolute top-16 right-6 bg-white border border-blue-200 rounded-xl shadow-md py-4 px-6 flex flex-col space-y-3 text-gray-700 md:hidden">
            <a
              href="/login"
              className="block px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition"
            >
              Iniciar sesión
            </a>
            <a
              href="/register"
              className="block px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
            >
              Registrarse
            </a>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4">
          Bienvenido a <span className="text-green-500">Net-Xe</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-8">
          Simplifica la gestión de tus contratos y documentos en línea. Net-Xe te ofrece una plataforma segura, moderna y fácil de usar para digitalizar procesos legales y administrativos.
        </p>

        <div className="flex space-x-4">
          <a
            href="/register"
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold text-lg hover:bg-green-600 transition"
          >
            Comenzar
          </a>
          <a
            href="/login"
            className="px-6 py-3 border-2 border-blue-700 text-blue-700 rounded-lg font-semibold text-lg hover:bg-blue-700 hover:text-white transition"
          >
            Iniciar sesión
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-4 border-blue-300 py-4 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} Net-Xe. Todos los derechos reservados.
      </footer>
    </div>
  );
}
