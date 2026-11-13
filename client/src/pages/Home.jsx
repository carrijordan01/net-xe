import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu, X, FilePlus2, FileSignature, FolderOpen, Download,
  ShieldCheck, Clock, Smartphone, Wallet, Scale, Users
} from "lucide-react";
import logo from "../assets/Net-Xe.png";
import { obtenerUsuario } from "../auth/sesion";

const funciones = [
  {
    Icono: FilePlus2,
    titulo: "Crear contratos",
    texto: "Elige una plantilla según el tipo de acuerdo y completa un formulario guiado, sin necesidad de conocimientos legales."
  },
  {
    Icono: FileSignature,
    titulo: "Firmar en línea",
    texto: "Ambas partes revisan y firman con una firma simple que registra fecha, hora y datos para su trazabilidad."
  },
  {
    Icono: FolderOpen,
    titulo: "Gestionar y consultar",
    texto: "Revisa tus contratos pendientes, firmados o rechazados y el historial de cada uno en un solo lugar."
  },
  {
    Icono: Download,
    titulo: "Descargar en PDF",
    texto: "Guarda una copia de tus contratos firmados para respaldarlos cuando lo necesites."
  }
];

const beneficios = [
  { Icono: Scale, titulo: "Respaldo legal", texto: "Acuerdos por escrito, amparados por la Ley N° 19.799 sobre documentos y firma electrónica." },
  { Icono: Wallet, titulo: "Bajo costo", texto: "Formaliza acuerdos básicos sin intermediarios ni herramientas pensadas para grandes empresas." },
  { Icono: Clock, titulo: "Ahorro de tiempo", texto: "Crea, envía y firma contratos en minutos, sin traslados ni papeleo." },
  { Icono: ShieldCheck, titulo: "Seguridad y trazabilidad", texto: "Cada acción queda registrada: quién creó, editó o firmó el contrato y cuándo." },
  { Icono: Smartphone, titulo: "Desde cualquier dispositivo", texto: "Una aplicación web responsiva que funciona en computador, tablet o celular." },
  { Icono: Users, titulo: "Confianza entre las partes", texto: "Términos claros para quien solicita y para quien presta el servicio." }
];

const botonPrimario =
  "px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition text-center";
const botonSecundario =
  "px-6 py-3 border-2 border-blue-700 text-blue-700 rounded-lg font-semibold hover:bg-blue-700 hover:text-white transition text-center";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const conSesion = Boolean(obtenerUsuario());

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      <header className="sticky top-0 z-20 flex justify-between items-center px-4 sm:px-6 md:px-12 py-3 border-b-4 border-blue-300 bg-white shadow-sm">
        <Link to="/" aria-label="Net-Xe, inicio">
          <img src={logo} alt="Net-Xe" className="h-10 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-700">
          <a href="#que-es" className="hover:text-blue-700">Qué es</a>
          <a href="#funciones" className="hover:text-blue-700">Qué permite</a>
          <a href="#origen" className="hover:text-blue-700">Cómo surgió</a>
          <a href="#beneficios" className="hover:text-blue-700">Beneficios</a>
          {conSesion ? (
            <Link to="/panel" className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition">
                Iniciar sesión
              </Link>
              <Link to="/register" className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
                Registrarse
              </Link>
            </>
          )}
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          className="md:hidden p-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {menuOpen && (
          <div className="absolute top-full right-4 mt-2 w-56 bg-white border border-blue-200 rounded-xl shadow-md py-4 px-5 flex flex-col space-y-3 text-gray-700 md:hidden">
            {[["#que-es", "Qué es"], ["#funciones", "Qué permite"], ["#origen", "Cómo surgió"], ["#beneficios", "Beneficios"]].map(([href, texto]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="hover:text-blue-700">{texto}</a>
            ))}
            {conSesion ? (
              <Link to="/panel" className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg text-center">
                Ir a mi panel
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg text-center">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg text-center">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Presentación */}
        <section id="que-es" className="bg-gradient-to-br from-green-50 to-blue-50 px-4 sm:px-6 py-16 md:py-24 scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4">
              Bienvenido a <span className="text-green-500 whitespace-nowrap">Net-Xe</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-4">
              La plataforma para crear, firmar y gestionar contratos de forma digital, simple y segura.
            </p>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Pensada para emprendedores, trabajadores independientes y micro, pequeñas y medianas empresas
              que necesitan formalizar sus acuerdos sin trámites complejos ni costos elevados.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/register" className={botonPrimario}>Crear una cuenta</Link>
              <Link to="/login" className={botonSecundario}>Iniciar sesión</Link>
            </div>
          </div>
        </section>

        {/* Qué permite hacer */}
        <section id="funciones" className="px-4 sm:px-6 py-16 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-blue-800 text-center mb-2">¿Qué puedes hacer con Net-Xe?</h2>
            <p className="text-center text-gray-600 mb-10">
              Todo el ciclo de un contrato, desde su creación hasta su firma y respaldo.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {funciones.map((item) => (
                <div key={item.titulo} className="p-6 bg-white rounded-2xl border-2 border-green-400 shadow-sm">
                  <item.Icono className="text-green-500 mb-3" size={32} />
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">{item.titulo}</h3>
                  <p className="text-sm text-gray-600">{item.texto}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Si eres Solicitante</h3>
                <p className="text-sm text-gray-700">
                  Creas el contrato a partir de una plantilla, lo envías a la otra parte, lo firmas y lo gestionas:
                  editarlo antes de la firma, eliminarlo o solicitar cambios cuando ya está firmado.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-green-50 border border-green-200">
                <h3 className="font-semibold text-green-700 mb-2">Si eres Contraparte</h3>
                <p className="text-sm text-gray-700">
                  Recibes los contratos que te ofrecen, los revisas con calma, los aceptas o rechazas
                  y, si estás de acuerdo, los firmas en línea.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo surgió y objetivo */}
        <section id="origen" className="px-4 sm:px-6 py-16 bg-gradient-to-br from-blue-50 to-green-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-blue-800 mb-4">¿Cómo surgió?</h2>
              <p className="text-gray-700 mb-3">
                En Chile, gran parte de los acuerdos entre emprendedores, microempresas y prestadores de servicios
                se cierran por mensajes, correos o de palabra. Esa informalidad deja a ambas partes sin respaldo
                ante un conflicto y limita el acceso a financiamiento y beneficios.
              </p>
              <p className="text-gray-700">
                Las herramientas de contratos digitales existentes están pensadas para grandes empresas y tienen
                costos altos. Net-Xe nace para cubrir ese espacio con una alternativa accesible y fácil de usar.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-blue-800 mb-4">Nuestro objetivo</h2>
              <p className="text-gray-700 mb-3">
                Facilitar la gestión de contratos por medios virtuales: que cualquier persona pueda generar,
                firmar y administrar sus acuerdos de forma digital, eficiente y segura.
              </p>
              <p className="text-gray-700">
                Así buscamos reducir la informalidad en las relaciones comerciales y dar más confianza y
                seguridad jurídica a quienes recién comienzan.
              </p>
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section id="beneficios" className="px-4 sm:px-6 py-16 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-blue-800 text-center mb-10">Beneficios</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {beneficios.map((item) => (
                <div key={item.titulo} className="flex gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <item.Icono className="text-blue-700 shrink-0" size={28} />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{item.titulo}</h3>
                    <p className="text-sm text-gray-600">{item.texto}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mt-8 max-w-3xl mx-auto">
              Net-Xe utiliza firma electrónica simple. No reemplaza la firma electrónica avanzada ni los contratos
              que por ley requieren trámites presenciales o ante notario.
            </p>
          </div>
        </section>

        {/* Llamado a la acción */}
        <section className="px-4 sm:px-6 py-16 bg-blue-900 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Formaliza tus acuerdos hoy</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Crea tu cuenta como Solicitante o Contraparte y comienza a gestionar tus contratos en línea.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/register" className={botonPrimario}>Registrarse</Link>
            <Link to="/login" className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition text-center">
              Ya tengo cuenta
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t-4 border-blue-300 py-4 text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} Net-Xe. Todos los derechos reservados.
      </footer>
    </div>
  );
}
