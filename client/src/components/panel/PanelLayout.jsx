import { useEffect, useReducer, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import logo from "../../assets/Net-Xe.png";
import { EVENTO_SESION, cerrarSesion, nombreRol, obtenerUsuario } from "../../auth/sesion";
import { menuPorRol } from "./menu";
import NotificacionesCampana from "./NotificacionesCampana";
import useNotificaciones from "./useNotificaciones";

// Estructura común de los paneles de Solicitante y Contraparte
export default function PanelLayout() {
  const usuario = obtenerUsuario();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  // Vuelve a dibujar el panel cuando cambian los datos del usuario (p. ej. su nombre)
  const [, refrescar] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    window.addEventListener(EVENTO_SESION, refrescar);
    return () => window.removeEventListener(EVENTO_SESION, refrescar);
  }, []);
  const { notificaciones, noLeidas, cargar, leer, leerTodas } = useNotificaciones();

  // Al cambiar de página: volver arriba y, en celular, cerrar el menú lateral
  useEffect(() => {
    setMenuAbierto(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Con el menú abierto en celular: Escape lo cierra y el fondo no se desplaza
  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclear = (e) => e.key === "Escape" && setMenuAbierto(false);
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  const salir = () => {
    cerrarSesion();
    navigate("/login", { replace: true, state: { mensaje: "Cerraste sesión correctamente." } });
  };

  const iniciales = `${usuario.firstName?.[0] ?? ""}${usuario.lastName?.[0] ?? ""}`.toUpperCase();
  const campana = (alinear) => (
    <NotificacionesCampana
      notificaciones={notificaciones}
      noLeidas={noLeidas}
      onLeer={leer}
      onLeerTodas={leerTodas}
      onAbrir={cargar}
      alinear={alinear}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 md:flex">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-blue-800 focus:shadow"
      >
        Saltar al contenido
      </a>
      {/* Barra superior (solo celular) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-blue-900 text-white px-4 py-2 shadow">
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          className="p-2 rounded-lg hover:bg-blue-800"
        >
          <Menu size={24} />
        </button>
        <Link to="/panel" className="bg-white rounded-lg px-2 py-1">
          <img src={logo} alt="Net-Xe" className="h-7 w-auto" />
        </Link>
        {campana("derecha")}
      </header>

      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMenuAbierto(false)} aria-hidden="true" />
      )}

      {/* Barra lateral */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen h-dvh w-72 max-w-[85vw] shrink-0 flex flex-col bg-blue-900 text-white transition-transform md:translate-x-0 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full invisible md:visible"
        }`}
        aria-label="Menú del panel"
      >
        <div className="p-4 border-b border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <Link to="/panel" className="bg-white rounded-lg px-2 py-1">
              <img src={logo} alt="Net-Xe" className="h-8 w-auto" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú"
              className="md:hidden p-2 rounded-lg hover:bg-blue-800"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/panel/perfil" className="flex items-center gap-3 min-w-0 flex-1 rounded-lg hover:bg-blue-800 p-1 -m-1">
              <span className="w-11 h-11 shrink-0 rounded-full bg-green-500 flex items-center justify-center font-bold">
                {iniciales || "?"}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold truncate">{usuario.firstName} {usuario.lastName}</span>
                <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full bg-blue-800 text-blue-100">
                  {nombreRol(usuario.role)}
                </span>
              </span>
            </Link>
            <div className="hidden md:block">{campana("izquierda")}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuPorRol(usuario.role).map((seccion) => (
            <div key={seccion.titulo}>
              <h2 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-blue-300">{seccion.titulo}</h2>
              <ul className="space-y-1">
                {seccion.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.exacto}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          isActive ? "bg-green-500 text-white font-semibold" : "text-blue-100 hover:bg-blue-800"
                        }`
                      }
                    >
                      <item.Icono size={18} />
                      {item.texto}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button
            type="button"
            onClick={salir}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-red-600 hover:text-white transition"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main id="contenido" tabIndex={-1} className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
