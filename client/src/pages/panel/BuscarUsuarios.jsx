import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Ban, Building2, Search } from "lucide-react";
import { nombreRol } from "../../auth/sesion";
import { buscarUsuarios } from "../../services/usuarios";
import { nombreCompleto } from "../../utils/formato";
import Iniciales from "../../components/ui/Iniciales";
import useTitulo from "../../utils/useTitulo";

const filtrosRol = [
  ["", "Todos"],
  ["SOLICITANTE", "Solicitantes"],
  ["CONTRAPARTE", "Contrapartes"]
];

export default function BuscarUsuarios() {
  useTitulo("Buscar usuarios");
  // La búsqueda queda en la URL para conservarla al volver desde un perfil
  const [params, setParams] = useSearchParams();
  const [texto, setTexto] = useState(params.get("q") ?? "");
  const role = params.get("rol") ?? "";
  const q = params.get("q") ?? "";

  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState("");

  // Espera a que el usuario deje de escribir antes de buscar
  useEffect(() => {
    const t = setTimeout(() => {
      const valor = texto.trim();
      if (valor !== q) {
        const siguiente = new URLSearchParams(params);
        if (valor) siguiente.set("q", valor);
        else siguiente.delete("q");
        setParams(siguiente, { replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [texto, q, params, setParams]);

  useEffect(() => {
    let vigente = true;
    setError("");
    buscarUsuarios({ q: q || undefined, role: role || undefined })
      .then((r) => vigente && setUsuarios(r))
      .catch(() => vigente && setError("No se pudo realizar la búsqueda."));
    return () => {
      vigente = false;
    };
  }, [q, role]);

  const cambiarRol = (valor) => {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set("rol", valor);
    else siguiente.delete("rol");
    setParams(siguiente, { replace: true });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Buscar usuarios</h1>
      <p className="text-gray-600 mt-1 mb-6">Encuentra a otros usuarios de Net-Xe por su nombre, correo o empresa.</p>

      <label className="relative block mb-3">
        <span className="sr-only">Buscar usuario</span>
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nombre, correo o empresa…"
          className="w-full pl-10 p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtrar por rol">
        {filtrosRol.map(([valor, etiqueta]) => (
          <button
            key={etiqueta}
            type="button"
            onClick={() => cambiarRol(valor)}
            aria-pressed={role === valor}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              role === valor ? "bg-blue-700 border-blue-700 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!usuarios && !error && <p className="text-gray-600">Buscando…</p>}
      {usuarios?.length === 0 && (
        <p className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-600">
          {q ? "Ningún usuario coincide con tu búsqueda." : "No hay usuarios para mostrar."}
        </p>
      )}

      {usuarios?.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {usuarios.length === 50 ? "Mostrando los primeros 50 resultados. Afina tu búsqueda para ver otros." : `${usuarios.length} ${usuarios.length === 1 ? "usuario" : "usuarios"}`}
          </p>
          <ul className="space-y-3">
            {usuarios.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/panel/usuarios/${u.id}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-green-400 transition"
                >
                  <Iniciales usuario={u} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-800">{nombreCompleto(u)}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{nombreRol(u.role)}</span>
                      {u.bloqueadoPorMi && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                          <Ban size={12} /> Bloqueado
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-gray-600 truncate">{u.email}</span>
                    {u.company && (
                      <span className="flex items-center gap-1 text-sm text-gray-500"><Building2 size={14} /> {u.company}</span>
                    )}
                  </span>
                  <span className="hidden sm:block text-sm text-blue-700">Ver perfil</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
