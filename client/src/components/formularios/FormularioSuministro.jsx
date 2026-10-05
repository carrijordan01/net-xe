import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioSuministro() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    producto: "",
    cantidad: "",
    frecuencia: "",
    precioUnitario: "",
    condicionesEntrega: "",
    penalizaciones: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "SUMINISTRO", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato SUMINISTRO:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Producto o servicio a suministrar*</label>
        <input name="producto" value={datos.producto}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Cantidad acordada*</label>
        <input type="number" name="cantidad" value={datos.cantidad}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Frecuencia de entrega*</label>
        <input name="frecuencia" value={datos.frecuencia}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"
          placeholder="Ej: Semanal, mensual, trimestral"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Precio unitario*</label>
        <input type="number" name="precioUnitario" value={datos.precioUnitario}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Condiciones de entrega</label>
        <textarea name="condicionesEntrega" value={datos.condicionesEntrega}
          onChange={handleChange} rows={2} className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Penalizaciones por incumplimiento</label>
        <textarea name="penalizaciones" value={datos.penalizaciones}
          onChange={handleChange} rows={2} className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Suministro
      </button>
    </form>
  );
}
