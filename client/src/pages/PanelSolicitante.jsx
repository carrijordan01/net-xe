import { useEffect, useState } from "react";
import { buscarContratos } from "../services/contratos";
import FiltrosContratos from "../components/contratos/FiltrosContratos";

export default function PanelSolicitante() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Panel de Solicitante</h2>

      <div className="p-4 bg-green-50 border border-green-300 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800">Crear nuevo contrato</h3>
        <p className="text-sm text-gray-600">Genera un contrato de cualquier tipo desde cero.</p>
        <a
          href="/crear-contrato"
          className="inline-block mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          Crear contrato
        </a>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800">Mis contratos creados</h3>
        <p className="text-sm text-gray-600">Revisa, edita o elimina contratos que hayas iniciado.</p>
        <a
          href="/mis-contratos"
          className="inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Ver contratos
        </a>
      </div>
    </div>
  );
}

export function ContratosSolicitante() {
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
              Estado: {c.firmadoContraparte && c.firmadoSolicitante ? "Firmado" : "Pendiente"}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
