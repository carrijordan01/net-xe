import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioAgencia() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    facultades: "",
    territorio: "",
    remuneracion: "",
    obligacionesAgente: "",
    obligacionesMandante: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "AGENCIA", datos});
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato AGENCIA:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Facultades del agente*</label>
        <textarea name="facultades" value={datos.facultades}
          onChange={handleChange} required rows={3}
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Territorio asignado*</label>
        <input name="territorio" value={datos.territorio}
          onChange={handleChange} required
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Remuneración*</label>
        <input name="remuneracion" value={datos.remuneracion}
          onChange={handleChange} required
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Obligaciones del agente*</label>
        <textarea name="obligacionesAgente" value={datos.obligacionesAgente}
          onChange={handleChange} required rows={3}
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Obligaciones del mandante*</label>
        <textarea name="obligacionesMandante" value={datos.obligacionesMandante}
          onChange={handleChange} required rows={3}
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Agencia
      </button>

    </form>
  );
}
