import { useEffect, useState } from "react";
import { buscarContratos } from "../services/contratos";
import FiltrosContratos from "../contratos/FiltrosContratos";

export default function PanelProponente() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Panel de Proponente</h2>

      <div className="p-4 bg-purple-50 border border-purple-300 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800">Contratos recibidos</h3>
        <p className="text-sm text-gray-600">Revisa los contratos que te han enviado para revisar o firmar.</p>
        <a
          href="/contratos-asignados"
          className="inline-block mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
        >
          Ver contratos recibidos
        </a>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800">Historial de contratos</h3>
        <p className="text-sm text-gray-600">Consulta contratos firmados o rechazados.</p>
        <a
          href="/historial"
          className="inline-block mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
        >
          Ver historial
        </a>
      </div>
    </div>
  );
}

export function ContratosProponente() {
  const [contratos, setContratos] = useState([]);

  const cargar = async (filtros = {}) => {
    const data = await buscarContratos(filtros);
    setContratos(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div>

      <FiltrosContratos onBuscar={cargar} />

      <h2 className="text-xl font-bold mb-2">Tus contratos</h2>

      <div className="space-y-3">
        {contratos.map(c => (
          <div key={c.id} className="border p-4 rounded-lg">
            <h3 className="font-semibold">{c.titulo}</h3>
            <p className="text-sm">{c.descripcion}</p>
            <p className="text-xs text-gray-500">Tipo: {c.tipo}</p>
            <p className="text-xs text-gray-500">
              Estado: {c.firmadoProponente && c.firmadoSolicitante ? "Firmado" : "Pendiente"}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
