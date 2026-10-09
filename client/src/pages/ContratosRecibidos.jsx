import { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function ContratosRecibidos() {
  const [contratos, setContratos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarContratos = async () => {
      try {
        const res = await api.get("/contratos/recibidos");
        setContratos(res.data);
      } catch (err) {
        console.error("Error al cargar contratos recibidos:", err);
      }
    };

    cargarContratos();
  }, []);

  const verContrato = (id) => {
    navigate(`/contrato/${id}`);
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">

      {/* Sidebar si existe */}
      <div className="w-64 bg-blue-900 text-white p-6">
        <h2 className="text-xl font-bold">Net-Xe</h2>
      </div>

      <div className="flex-1 p-8">

        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          Contratos Recibidos
        </h1>

        {contratos.length === 0 && (
          <p className="text-gray-600 text-lg">
            No has recibido contratos todavía.
          </p>
        )}

        <div className="space-y-4">
          {contratos.map((c) => (
            <div
              key={c.id}
              className="p-5 bg-white rounded-xl shadow border flex justify-between items-center"
            >
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {c.tipo.replace("_", " ")}
                </p>
                <p className="text-gray-600 text-sm">
                  Solicitante: {c.solicitante.firstName} {c.solicitante.lastName}
                </p>
                <p className="text-gray-400 text-xs">
                  Recibido el {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => verContrato(c.id)}
                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg"
              >
                Ver
              </button>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
