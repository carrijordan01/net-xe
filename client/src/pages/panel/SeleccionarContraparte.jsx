import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, Search } from "lucide-react";
import { api } from "../../api";
import { obtenerPlantilla } from "../../services/plantillas";
import { nombreCompleto } from "../../utils/formato";
import useTitulo from "../../utils/useTitulo";

const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function SeleccionarContraparte() {
  useTitulo("Elegir contraparte");
  const { tipoContrato } = useParams();
  const navigate = useNavigate();
  const [plantilla, setPlantilla] = useState(null);
  const [usuarios, setUsuarios] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([obtenerPlantilla(tipoContrato), api.get("/usuarios", { params: { role: "CONTRAPARTE", disponibles: 1 } })])
      .then(([p, r]) => {
        setPlantilla(p);
        setUsuarios(r.data);
      })
      .catch((err) =>
        setError(err.response?.status === 404 ? "Plantilla de contrato no encontrada." : "No se pudieron cargar las contrapartes.")
      );
  }, [tipoContrato]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/panel/crear" className="text-blue-700 hover:underline">Volver al catálogo</Link>
      </div>
    );
  }
  if (!usuarios) return <p className="text-gray-600">Cargando contrapartes…</p>;

  const texto = sinTildes(busqueda.trim());
  const filtrados = usuarios.filter((u) =>
    sinTildes(`${u.firstName} ${u.lastName} ${u.email} ${u.company ?? ""}`).includes(texto)
  );

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-sm text-green-600 font-semibold">{plantilla.nombre}</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1">¿A quién le ofreces el contrato?</h1>
      <p className="text-gray-600 mt-1 mb-6">
        Elige la contraparte que recibirá el contrato.{" "}
        <Link to="/panel/crear" className="text-blue-700 hover:underline">Cambiar plantilla</Link>
      </p>

      <label className="relative block mb-6">
        <span className="sr-only">Buscar contraparte</span>
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o empresa…"
          className="w-full pl-10 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </label>

      {usuarios.length === 0 && (
        <p className="text-gray-600">Todavía no hay usuarios registrados como Contraparte.</p>
      )}
      {usuarios.length > 0 && filtrados.length === 0 && (
        <p className="text-gray-600">Ninguna contraparte coincide con tu búsqueda.</p>
      )}

      <ul className="space-y-3">
        {filtrados.map((u) => (
          <li key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800">{nombreCompleto(u)}</p>
              <p className="text-sm text-gray-600 break-all">{u.email}</p>
              {u.company && (
                <p className="text-sm text-gray-500 flex items-center gap-1"><Building2 size={14} /> {u.company}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/panel/crear/${tipoContrato}/${u.id}`)}
              className="shrink-0 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
            >
              Seleccionar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
