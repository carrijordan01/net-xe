import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioHipoteca() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    direccionInmueble: "",
    rol: "",
    valorInmueble: "",
    montoHipoteca: "",
    conservador: "",
    plazo: "",
    condiciones: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "HIPOTECA", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato HIPOTECA:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Dirección del inmueble*</label>
        <input name="direccionInmueble" value={datos.direccionInmueble}
          onChange={handleChange} required
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Rol del inmueble*</label>
        <input name="rol" value={datos.rol} onChange={handleChange}
          required className="w-full p-2 border rounded-lg bg-gray-50"
          placeholder="Ej: Rol 12345-6"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Valor del inmueble*</label>
        <input type="number" name="valorInmueble" value={datos.valorInmueble}
          onChange={handleChange} required
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Monto asegurado por la hipoteca*</label>
        <input type="number" name="montoHipoteca" value={datos.montoHipoteca}
          onChange={handleChange} required
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Conservador de Bienes Raíces*</label>
        <input name="conservador" value={datos.conservador} onChange={handleChange}
          required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Plazo de la hipoteca*</label>
        <input name="plazo" value={datos.plazo}
          onChange={handleChange} required
          className="w-full p-2 border rounded-lg bg-gray-50" 
          placeholder="Ej: 10 años"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Condiciones adicionales (opcional)</label>
        <textarea name="condiciones" value={datos.condiciones} onChange={handleChange}
          className="w-full p-2 border rounded-lg bg-gray-50" rows={2}/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Hipoteca
      </button>

    </form>
  );
}
