import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioReemplazo() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    fechaTermino: "",
    valor: "",
    trabajadorReemplazado: "",
    motivoReemplazo: "",
    cargo: "",
    remuneracion: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "REEMPLAZO", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato REEMPLAZO:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Trabajador reemplazado*</label>
        <input name="trabajadorReemplazado" value={datos.trabajadorReemplazado}
          onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Motivo del reemplazo*</label>
        <textarea name="motivoReemplazo" value={datos.motivoReemplazo}
          onChange={handleChange} required className="w-full p-2 border rounded-lg bg-gray-50" rows={3}/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Fecha término*</label>
          <input type="date" name="fechaTermino" value={datos.fechaTermino}
            onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required/>
        </div>

        <div>
          <label className="block text-sm font-medium">Remuneración*</label>
          <input name="remuneracion" value={datos.remuneracion}
            onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50" required/>
        </div>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Reemplazo
      </button>
      
    </form>
  );
}
