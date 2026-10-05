import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioDonacion() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    bienDonado: "",
    valorEstimado: "",
    condiciones: "",
    motivo: "",
    esRevocable: "no",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "DONACION", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato DONACION:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Bien donado*</label>
        <input name="bienDonado" value={datos.bienDonado}
          onChange={handleChange} required
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Valor estimado del bien*</label>
        <input type="number" name="valorEstimado" value={datos.valorEstimado}
          onChange={handleChange} required
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Motivo de la donación (opcional)</label>
        <textarea name="motivo" value={datos.motivo}
          onChange={handleChange} rows={2}
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Condiciones o cargas (si existen)</label>
        <textarea name="condiciones" value={datos.condiciones}
          onChange={handleChange} rows={2}
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">¿Es revocable?</label>
        <select name="esRevocable" value={datos.esRevocable} onChange={handleChange}
          className="w-full p-2 border rounded-lg bg-gray-50">
          <option value="no">No, es irrevocable</option>
          <option value="si">Sí, es revocable según condiciones</option>
        </select>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Donación
      </button>

    </form>
  );
}
