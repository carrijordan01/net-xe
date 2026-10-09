import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  obtenerContrato,
  firmarContraparte,
  firmarSolicitante,
} from "../services/contratos";

export default function FirmaContrato() {
  const { id } = useParams();
  const [contrato, setContrato] = useState(null);
  const [acepto, setAcepto] = useState(false);

  // "contraparte" | "solicitante", según el usuario guardado al iniciar sesión
  const rol = (JSON.parse(localStorage.getItem("user") || "{}").role || "").toLowerCase();

  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerContrato(id);
      setContrato(data);
    };
    cargar();
  }, [id]);

  const handleFirmar = async () => {
    if (!acepto) return alert("Debes aceptar el contenido antes de firmar.");

    try {
      if (rol === "contraparte") {
        await firmarContraparte(id);
      } else {
        await firmarSolicitante(id);
      }

      alert("Contrato firmado correctamente.");
      window.location.reload();
    } catch (error) {
      console.error("Error al firmar contrato:", error);
      alert("No se pudo firmar.");
    }
  };

  if (!contrato) return <p>Cargando...</p>;

  const yaFirmado =
    (rol === "contraparte" && contrato.firmadoContraparte) ||
    (rol === "solicitante" && contrato.firmadoSolicitante);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firma del contrato</h1>

      <p>{contrato.descripcion}</p>
      <pre className="bg-gray-100 p-3 mt-4 whitespace-pre-wrap">
        {contrato.clausulas}
      </pre>

      {yaFirmado ? (
        <p className="text-green-600 font-bold mt-4">
          Ya has firmado este contrato.
        </p>
      ) : (
        <div className="mt-4">
          <label>
            <input
              type="checkbox"
              checked={acepto}
              onChange={(e) => setAcepto(e.target.checked)}
            />
            &nbsp; Acepto el contenido del contrato y deseo firmar.
          </label>

          <button
            className="bg-blue-600 text-white px-4 py-2 mt-3 rounded"
            onClick={handleFirmar}
          >
            Firmar contrato
          </button>
        </div>
      )}
    </div>
  );
}
