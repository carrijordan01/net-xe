import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioPlazoFijo() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    fechaTermino: "",
    valor: 0,
    cargo: "",
    motivo: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "PLAZO_FIJO", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato PLAZO_FIJO:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Fecha término*</label>
        <input type="date" name="fechaTermino" value={datos.fechaTermino} 
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" required/>
      </div>

      <div>
        <label className="block text-sm font-medium">Cargo*</label>
        <input name="cargo" value={datos.cargo} onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" required/>
      </div>

      <div>
        <label className="block text-sm font-medium">Motivo del plazo fijo*</label>
        <textarea name="motivo" value={datos.motivo} onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" rows="3" required/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato plazo fijo
      </button>
    </form>
  );
}
