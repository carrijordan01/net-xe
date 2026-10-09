import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioIndefinido() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    valor: 0,
    cargo: "",
    funciones: "",
    jornada: "",
    lugarTrabajo: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "INDEFINIDO", datos });
      alert("Contrato de indefinido creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato de indefinido:", error);
      alert("Error al crear contrato de indefinido");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Cargo*</label>
        <input
          name="cargo"
          value={datos.cargo}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Funciones*</label>
        <textarea
          name="funciones"
          value={datos.funciones}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
          rows="3"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Jornada*</label>
        <input
          name="jornada"
          value={datos.jornada}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Lugar de trabajo*</label>
        <input
          name="lugarTrabajo"
          value={datos.lugarTrabajo}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
          required
        />
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato indefinido
      </button>
    </form>
  );
}
