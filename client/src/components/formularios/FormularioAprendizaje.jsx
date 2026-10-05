import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioAprendizaje() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    valor: "",
    areaFormacion: "",
    institucion: "",
    cargo: "",
    jornada: "",
    asignacionMensual: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "APRENDIZAJE", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato APRENDIZAJE:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Área de formación*</label>
        <input name="areaFormacion" value={datos.areaFormacion} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Institución donde estudia*</label>
        <input name="institucion" value={datos.institucion} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Cargo asignado*</label>
        <input name="cargo" value={datos.cargo} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Jornada*</label>
        <input name="jornada" value={datos.jornada} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Asignación mensual*</label>
        <input type="number" name="asignacionMensual" value={datos.asignacionMensual}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Aprendizaje
      </button>

    </form>
  );
}
