import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioServiciosProfesionales() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    fechaTermino: "",
    servicio: "",
    honorarios: "",
    condiciones: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "SERVICIOS_PROFESIONALES", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato SERVICIOS_PROFESIONALES:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Servicio a realizar*</label>
        <textarea name="servicio" value={datos.servicio} onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" rows="3" required/>
      </div>

      <div>
        <label className="block text-sm font-medium">Honorarios*</label>
        <input type="number" name="honorarios" value={datos.honorarios} 
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" required/>
      </div>

      <div>
        <label className="block text-sm font-medium">Condiciones adicionales</label>
        <textarea name="condiciones" value={datos.condiciones} onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" rows="3"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de servicios profesionales
      </button>
    </form>
  );
}
