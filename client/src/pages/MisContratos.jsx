import { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import { descargarPDF } from "../services/contratos";

export default function MisContratos() {
  const [contratos, setContratos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarContratos = async () => {
      try {
        const res = await api.get("/contratos/mios");
        setContratos(res.data);
      } catch (err) {
        console.error("Error al cargar contratos:", err);
      }
    };

    cargarContratos();
  }, []);

  const eliminarContrato = async (id) => {
    if (!confirm("¿Está seguro que desea eliminar este contrato?")) return;

    try {
      await api.delete(`/contratos/${id}`);

      setContratos(contratos.filter(c => c.id !== id));
      alert("Contrato eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar contrato:", err);
      alert("Hubo un error al eliminar el contrato.");
    }
  };

  const verContrato = (id) => {
    navigate(`/contrato/${id}`);
  };

  const handleDescargarPDF = async (contratoId) => {
    try {
      const blob = await descargarPDF(contratoId);
      const url = window.URL.createObjectURL(new Blob([blob]));

      const link = document.createElement("a");
      link.href = url;
      link.download = `contrato_${contratoId}.pdf`;
      link.click();
    }catch (error) {
      console.error("Error al descargar el contrato:", error);
      alert("No se pudo descargar el contrato.");
    }
  };


  return (
    <div className="flex bg-gray-100 min-h-screen">
    
      <div className="w-64 bg-blue-900 text-white p-6">
        <h2 className="text-xl font-bold">Net-Xe</h2>
      </div>

      <div className="flex-1 p-8">

        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          Mis Contratos
        </h1>

        {contratos.length === 0 && (
          <p className="text-gray-600 text-lg">
            Aún no has creado ningún contrato.
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
                  Contraparte: {c.contraparte.firstName} {c.contraparte.lastName}
                </p>
                <p className="text-gray-400 text-xs">
                  Creado el {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-3">

                <button
                  onClick={() => verContrato(c.id)}
                  className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg"
                >
                  Ver
                </button>

                <button
                  onClick={() => eliminarContrato(c.id)}
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg"
                >
                  Eliminar
                </button>

                <button
                  onClick={() => handleDescargarPDF(c.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded mt-3"
                >
                    Descargar PDF
                </button>


              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
