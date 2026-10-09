import { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate, useParams } from "react-router-dom";

export default function DetalleContrato() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get(`/contratos/${id}`);
        setContrato(res.data);
      } catch (err) {
        console.error("Error cargando contrato:", err);
        alert("No se pudo cargar el contrato.");
      }
    };

    cargar();
  }, [id]);

  if (!contrato) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Cargando contrato...
      </div>
    );
  }

  const { tipo, solicitante, contraparte, datos, createdAt } = contrato;
  const entradasDatos = datos ? Object.entries(datos) : [];

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <div className="w-64 bg-blue-900 text-white p-6">
        <h2 className="text-xl font-bold">Net-Xe</h2>
      </div>

      <div className="flex-1 p-10">

        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          Detalle del Contrato
        </h1>

        <div className="bg-white shadow rounded-xl p-6 border mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Información General</h2>

          <p className="text-gray-700 mt-3">
            <b>Tipo de contrato:</b> {tipo.replaceAll("_", " ")}
          </p>

          <p className="text-gray-700">
            <b>Fecha de creación:</b> {new Date(createdAt).toLocaleString()}
          </p>

          <p className="text-gray-700 mt-3">
            <b>Solicitante:</b> {solicitante.firstName} {solicitante.lastName} ({solicitante.email})
          </p>

          <p className="text-gray-700">
            <b>Contraparte:</b> {contraparte.firstName} {contraparte.lastName} ({contraparte.email})
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6 border">
          <h2 className="text-xl font-semibold text-gray-800">Datos del Contrato</h2>

          <div className="mt-4 space-y-3">
            {entradasDatos.map(([key, value]) => (
              <div key={key} className="border-b pb-3 text-gray-700">
                <b className="capitalize">
                  {key.replaceAll("_", " ").replace(/([A-Z])/g, " $1")}
                </b>:{" "}

                {typeof value === "string" || typeof value === "number" ? (
                  <span className="ml-1">{value}</span>
                ) : (
                  <pre className="text-sm text-gray-600 bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Volver
          </button>

          <button
            disabled
            className="px-4 py-2 bg-blue-400 text-white rounded-lg cursor-not-allowed"
          >
            Descargar PDF (pronto)
          </button>

          <button
            disabled
            className="px-4 py-2 bg-green-400 text-white rounded-lg cursor-not-allowed"
          >
            Firmar / Aprobar (pronto)
          </button>
        </div>
      </div>
    </div>
  );
}
