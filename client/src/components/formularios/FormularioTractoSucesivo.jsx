import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioTractoSucesivo() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    obligacion: "",
    periodicidad: "",
    montoPeriodo: "",
    duracionMeses: "",
    condicionesRenovacion: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "TRACTO_SUCESIVO", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato TRACTO_SUCESIVO:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Tipo de obligación periódica*</label>
        <input name="obligacion" value={datos.obligacion}
          onChange={handleChange} required placeholder="Pago, servicio, entrega, etc."
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Periodicidad*</label>
        <input name="periodicidad" value={datos.periodicidad}
          onChange={handleChange} required placeholder="Mensual, semanal, trimestral..."
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Monto por período*</label>
          <input type="number" name="montoPeriodo" value={datos.montoPeriodo}
            onChange={handleChange} required
            className="w-full p-2 bg-gray-50 border rounded-lg"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Duración total (meses)*</label>
          <input type="number" name="duracionMeses" value={datos.duracionMeses}
            onChange={handleChange} required
            className="w-full p-2 bg-gray-50 border rounded-lg"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Condiciones de renovación (opcional)</label>
        <textarea name="condicionesRenovacion" value={datos.condicionesRenovacion}
          onChange={handleChange} rows={2}
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Tracto Sucesivo
      </button>
    </form>
  );
}
