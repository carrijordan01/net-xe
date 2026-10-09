import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioObraFaena() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    valor: "",
    descripcionObra: "",
    ubicacionObra: "",
    cargo: "",
    remuneracion: "",
    jornada: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "OBRA_FAENA", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato OBRA_FAENA:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Descripción de la obra o faena*</label>
        <textarea name="descripcionObra" value={datos.descripcionObra}
          onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50" rows={3}/>
      </div>

      <div>
        <label className="block text-sm font-medium">Ubicación de la obra*</label>
        <input name="ubicacionObra" value={datos.ubicacionObra}
          onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Cargo*</label>
          <input name="cargo" value={datos.cargo}
            onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Remuneración*</label>
          <input name="remuneracion" value={datos.remuneracion}
            onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Jornada*</label>
        <input name="jornada" value={datos.jornada}
          onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Obra o Faena
      </button>

    </form>
  );
}
