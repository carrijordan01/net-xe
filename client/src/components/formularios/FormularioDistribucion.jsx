import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioDistribucion() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    productos: "",
    zona: "",
    margenGanancia: "",
    obligacionesDistribuidor: "",
    obligacionesProveedor: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "DISTRIBUCION", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato DISTRIBUCION:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Productos a distribuir*</label>
        <textarea name="productos" value={datos.productos}
          onChange={handleChange} required rows={2}
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Zona asignada*</label>
        <input name="zona" value={datos.zona} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Margen de ganancia (%)</label>
        <input type="number" name="margenGanancia" value={datos.margenGanancia}
          onChange={handleChange} className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Obligaciones del distribuidor*</label>
        <textarea name="obligacionesDistribuidor" value={datos.obligacionesDistribuidor}
          onChange={handleChange} required rows={3}
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Obligaciones del proveedor*</label>
        <textarea name="obligacionesProveedor" value={datos.obligacionesProveedor}
          onChange={handleChange} required rows={3}
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Distribución
      </button>

    </form>
  );
}
