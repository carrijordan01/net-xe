import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioEjecucionInmediata() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    descripcionActo: "",
    monto: "",
    formaPago: "",
    confirmacionEntrega: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "EJECUCION_INMEDIATA", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato EJECUCION_INMEDIATA:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Descripción del acto contractual*</label>
        <textarea name="descripcionActo" value={datos.descripcionActo}
          onChange={handleChange} required rows={2}
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Monto involucrado*</label>
        <input type="number" name="monto" value={datos.monto}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Forma de pago*</label>
        <input name="formaPago" value={datos.formaPago}
          onChange={handleChange} required placeholder="Transferencia, efectivo, etc."
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Entrega inmediata*</label>
        <input name="confirmacionEntrega" value={datos.confirmacionEntrega}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"
          placeholder="Ej: Entregado al momento del pago"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Ejecución Inmediata
      </button>
    </form>
  );
}
