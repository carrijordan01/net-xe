import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioJornadaParcial() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    valor: "",
    cargo: "",
    sueldo: "",
    horasSemanales: "",
    horarioDetalle: "",
    lugarTrabajo: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "JORNADA_PARCIAL", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato JORNADA_PARCIAL:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Cargo*</label>
          <input name="cargo" value={datos.cargo} onChange={handleChange}
            required className="w-full p-2 border rounded-lg bg-gray-50"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Sueldo mensual*</label>
          <input type="number" name="sueldo" value={datos.sueldo} onChange={handleChange}
            required className="w-full p-2 border rounded-lg bg-gray-50"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Horas semanales*</label>
        <input type="number" name="horasSemanales" value={datos.horasSemanales}
          onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Detalle del horario*</label>
        <textarea name="horarioDetalle" value={datos.horarioDetalle}
          onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50" rows={3}/>
      </div>

      <div>
        <label className="block text-sm font-medium">Lugar de trabajo*</label>
        <input name="lugarTrabajo" value={datos.lugarTrabajo}
          onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Jornada Parcial
      </button>
      
    </form>
  );
}
