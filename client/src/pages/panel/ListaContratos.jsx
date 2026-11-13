import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Search } from "lucide-react";
import { obtenerUsuario } from "../../auth/sesion";
import { buscarContratos, eliminarContrato } from "../../services/contratos";
import { estadosPorRol } from "../../components/panel/menu";
import useCatalogo from "../../components/contratos/useCatalogo";
import TarjetaContrato from "../../components/contratos/TarjetaContrato";
import { tituloContrato } from "../../components/contratos/estados";
import { nombreCompleto } from "../../utils/formato";
import useConfirmar from "../../components/ui/useConfirmar";
import useTitulo from "../../utils/useTitulo";

const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const titulos = {
  todos: { SOLICITANTE: "Todos mis contratos", CONTRAPARTE: "Contratos recibidos" },
  pendientes: "Contratos pendientes",
  firmados: "Contratos firmados",
  eliminados: "Contratos eliminados",
  rechazados: "Contratos rechazados"
};

const vacios = {
  todos: { SOLICITANTE: "Aún no has creado contratos.", CONTRAPARTE: "Aún no has recibido contratos." },
  pendientes: "No tienes contratos pendientes.",
  firmados: "Todavía no tienes contratos firmados por ambas partes.",
  eliminados: "No has eliminado contratos.",
  rechazados: "No has rechazado contratos."
};

const descripciones = {
  pendientes: {
    SOLICITANTE: "Contratos enviados que esperan la revisión, aceptación o firma de alguna de las partes.",
    CONTRAPARTE: "Contratos que te ofrecieron y esperan tu revisión, aceptación o firma."
  },
  firmados: "Contratos firmados por ambas partes.",
  eliminados: "Contratos que eliminaste. Se conservan solo para consulta.",
  rechazados: "Contratos que decidiste no aceptar."
};

const porRol = (valor, rol) => (typeof valor === "string" ? valor : valor?.[rol]);

export default function ListaContratos() {
  const confirmar = useConfirmar();
  const { estado: seccion = "todos" } = useParams();
  const usuario = obtenerUsuario();
  const catalogo = useCatalogo();
  const estados = seccion === "todos" ? null : estadosPorRol[usuario.role]?.[seccion];
  useTitulo(porRol(titulos[seccion], usuario.role));

  const [contratos, setContratos] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [orden, setOrden] = useState("desc");

  const cargar = useCallback(() => {
    setError("");
    buscarContratos({ estado: estados?.join(","), tipo, orden })
      .then(setContratos)
      .catch(() => setError("No se pudieron cargar los contratos."));
  }, [estados, tipo, orden]);

  useEffect(() => {
    setContratos(null);
    cargar();
  }, [cargar]);

  // Al cambiar de sección se limpian los filtros y mensajes
  useEffect(() => {
    setBusqueda("");
    setTipo("TODOS");
    setMensaje("");
  }, [seccion]);

  const visibles = useMemo(() => {
    if (!contratos) return [];
    const texto = sinTildes(busqueda.trim());
    if (!texto) return contratos;
    return contratos.filter((c) => {
      const otra = usuario.role === "SOLICITANTE" ? c.contraparte : c.solicitante;
      return sinTildes(`${tituloContrato(c, catalogo)} ${nombreCompleto(otra)} ${otra.email}`).includes(texto);
    });
  }, [contratos, busqueda, catalogo, usuario.role]);

  if (seccion !== "todos" && !estados) return <Navigate to="/panel" replace />;

  const eliminar = async (contrato) => {
    const nombre = tituloContrato(contrato, catalogo);
    const ok = await confirmar({
      titulo: "Eliminar contrato",
      mensaje: `¿Eliminar «${nombre}»? Quedará en la sección Eliminados solo para consulta.`,
      confirmar: "Eliminar",
      peligro: true
    });
    if (!ok) return;
    try {
      await eliminarContrato(contrato.id);
      setMensaje(`Se eliminó «${nombre}».`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo eliminar el contrato.");
    }
  };

  const filtrando = busqueda.trim() || tipo !== "TODOS";

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">{porRol(titulos[seccion], usuario.role)}</h1>
      {descripciones[seccion] && <p className="text-gray-600 mt-1">{porRol(descripciones[seccion], usuario.role)}</p>}

      <div className="mt-6 mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="relative sm:col-span-2 xl:col-span-1">
          <span className="sr-only">Buscar contrato</span>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar por contrato o ${usuario.role === "SOLICITANTE" ? "contraparte" : "solicitante"}…`}
            className="w-full pl-10 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Tipo de contrato</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="TODOS">Todos los tipos</option>
            {catalogo?.plantillas.map((p) => <option key={p.tipo} value={p.tipo}>{p.nombre}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Orden</span>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="desc">Más recientes primero</option>
            <option value="asc">Más antiguos primero</option>
          </select>
        </label>
      </div>

      {mensaje && <p role="status" className="mb-4 p-3 rounded-lg bg-green-50 border border-green-400 text-sm text-green-800">{mensaje}</p>}
      {error && <p role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{error}</p>}

      {!contratos && !error && <p className="text-gray-600">Cargando contratos…</p>}

      {contratos && visibles.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-600">
          {filtrando ? "Ningún contrato coincide con los filtros." : porRol(vacios[seccion], usuario.role)}
          {!filtrando && usuario.role === "SOLICITANTE" && ["todos", "pendientes"].includes(seccion) && (
            <Link to="/panel/crear" className="block w-fit mx-auto mt-4 px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
              Crear un contrato
            </Link>
          )}
        </div>
      )}

      {visibles.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {visibles.length} {visibles.length === 1 ? "contrato" : "contratos"}
          </p>
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {visibles.map((c) => (
              <TarjetaContrato key={c.id} contrato={c} rol={usuario.role} catalogo={catalogo} onEliminar={eliminar} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
