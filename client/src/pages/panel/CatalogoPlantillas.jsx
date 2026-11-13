import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Briefcase, Handshake, ShoppingCart, Store, Landmark, FileText, Search, AlertTriangle, ChevronDown
} from "lucide-react";
import { api } from "../../api";
import { obtenerCatalogo } from "../../services/plantillas";
import { nombreCompleto } from "../../utils/formato";
import useTitulo from "../../utils/useTitulo";

const iconosCategoria = {
  LABORAL: Briefcase,
  SERVICIOS: Handshake,
  COMPRAVENTA: ShoppingCart,
  COMERCIAL: Store,
  CIVIL: Landmark,
  GENERICA: FileText
};

const estiloNivel = {
  COMPLETA: "bg-green-100 text-green-800",
  SIMPLIFICADA: "bg-blue-100 text-blue-800",
  GENERICA: "bg-gray-100 text-gray-700"
};

const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function TarjetaPlantilla({ plantilla, niveles, modalidades, contraparteId }) {
  const [verCampos, setVerCampos] = useState(false);

  return (
    <article className="flex flex-col p-5 bg-white rounded-2xl border-2 border-green-400 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-800">{plantilla.nombre}</h3>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${estiloNivel[plantilla.nivel]}`}>
          {niveles[plantilla.nivel]}
        </span>
      </div>

      <p className="text-sm text-gray-600 flex-1">{plantilla.descripcion}</p>

      {plantilla.advertencia && (
        <p className="mt-3 flex gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
          <AlertTriangle size={16} className="shrink-0" />
          {plantilla.advertencia}
        </p>
      )}

      <p className="mt-3 text-xs text-gray-500">
        {plantilla.cantidadCampos} datos específicos · {plantilla.camposRequeridos} obligatorios
        {plantilla.modalidadSugerida && <> · {modalidades[plantilla.modalidadSugerida]}</>}
      </p>

      <button
        type="button"
        onClick={() => setVerCampos(!verCampos)}
        aria-expanded={verCampos}
        className="mt-2 self-start flex items-center gap-1 text-sm text-blue-700 hover:underline"
      >
        {verCampos ? "Ocultar datos que pide" : "Ver datos que pide"}
        <ChevronDown size={16} className={`transition-transform ${verCampos ? "rotate-180" : ""}`} />
      </button>
      {verCampos && (
        <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-0.5">
          {plantilla.etiquetasCampos.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      <Link
        to={`/panel/crear/${plantilla.tipo}/${contraparteId ?? "contraparte"}`}
        className="mt-4 text-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
      >
        Usar esta plantilla
      </Link>
    </article>
  );
}

export default function CatalogoPlantillas() {
  useTitulo("Crear contrato");
  const [catalogo, setCatalogo] = useState(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [params, setParams] = useSearchParams();
  const contraparteId = params.get("contraparte");
  const [contraparte, setContraparte] = useState(null);

  useEffect(() => {
    obtenerCatalogo()
      .then(setCatalogo)
      .catch(() => setError("No se pudo cargar el catálogo de plantillas."));
  }, []);

  // Si se llega desde una contraparte ya elegida, se salta su selección
  useEffect(() => {
    if (!contraparteId) {
      setContraparte(null);
      return;
    }
    api.get(`/usuarios/${contraparteId}`)
      .then((r) => setContraparte(r.data.role === "CONTRAPARTE" && !r.data.bloqueadoPorMi && !r.data.meBloqueo ? r.data : null))
      .catch(() => setContraparte(null));
  }, [contraparteId]);

  const grupos = useMemo(() => {
    if (!catalogo) return [];
    const texto = sinTildes(busqueda.trim());
    const filtradas = catalogo.plantillas.filter(
      (p) =>
        (categoria === "TODAS" || p.categoria === categoria) &&
        (!texto || sinTildes(`${p.nombre} ${p.descripcion}`).includes(texto))
    );
    return Object.keys(catalogo.categorias)
      .map((cat) => ({ cat, plantillas: filtradas.filter((p) => p.categoria === cat) }))
      .filter((g) => g.plantillas.length > 0);
  }, [catalogo, busqueda, categoria]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!catalogo) return <p className="text-gray-600">Cargando catálogo…</p>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Crear contrato</h1>
      <p className="text-gray-600 mt-1 mb-6">
        Elige la plantilla que mejor se ajuste a tu acuerdo. Si ninguna calza, usa el contrato simple personalizado.
      </p>

      {contraparte && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 mb-6 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-sm text-gray-700">
            Creando un contrato para <b>{nombreCompleto(contraparte)}</b> ({contraparte.email}).
          </p>
          <button type="button" onClick={() => setParams({})} className="text-sm text-blue-700 hover:underline self-start sm:self-auto">
            Elegir otra contraparte después
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-8">
        <label className="relative">
          <span className="sr-only">Buscar plantilla</span>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="w-full pl-10 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          {[["TODAS", "Todas"], ...Object.entries(catalogo.categorias)].map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setCategoria(valor)}
              aria-pressed={categoria === valor}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                categoria === valor
                  ? "bg-blue-700 border-blue-700 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
              }`}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>

      {grupos.length === 0 && (
        <p className="text-gray-600">No hay plantillas que coincidan con tu búsqueda.</p>
      )}

      <div className="space-y-10">
        {grupos.map(({ cat, plantillas }) => {
          const Icono = iconosCategoria[cat];
          return (
            <section key={cat}>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                <Icono size={20} className="text-blue-700" />
                {catalogo.categorias[cat]}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {plantillas.map((p) => (
                  <TarjetaPlantilla key={p.tipo} plantilla={p} niveles={catalogo.niveles} modalidades={catalogo.modalidades} contraparteId={contraparte?.id} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
