import { useEffect, useState } from "react";
import axios from "axios";

export default function HistorialContrato({ contratoId }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistorial() {
      try {
        const response = await axios.get(`/api/historial/${contratoId}`);
        setHistorial(response.data);
      } catch (err) {
        console.error("Error al cargar historial:", err);
        setError("No se pudo cargar el historial.");
      } finally {
        setLoading(false);
      }
    }

    if (contratoId) {
      fetchHistorial();
    }
  }, [contratoId]);

  if (loading) {
    return (
      <div className="text-gray-600 italic">Cargando historial...</div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 font-semibold text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full mt-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
        Historial del contrato
      </h2>

      {historial.length === 0 && (
        <p className="text-gray-500 italic">
          No hay eventos registrados en el historial.
        </p>
      )}

      <div className="space-y-4">
        {historial.map((item) => (
          <div
            key={item.id}
            className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded shadow-sm"
          >

            <p className="text-lg font-semibold text-gray-800">
              {item.evento}
            </p>

            {item.comentario && (
              <p className="text-gray-700 mt-1">
                <span className="font-semibold">Detalle:</span> {item.comentario}
              </p>
            )}

            <p className="text-sm text-gray-600 mt-2">
              {item.usuario?.firstName} {item.usuario?.lastName} —{" "}
              {new Date(item.fecha).toLocaleString("es-CL", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
