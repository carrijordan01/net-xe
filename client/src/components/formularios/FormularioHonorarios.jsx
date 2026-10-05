import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioHonorarios() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    servicio: "",
    monto: "",
    formaPago: "",
    condiciones: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "HONORARIOS", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato HONORARIOS:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Servicio a prestar*</label>
        <textarea name="servicio" value={datos.servicio} onChange={handleChange}
          required className="w-full p-2 border rounded-lg bg-gray-50" rows={3}/>
      </div>

      <div>
        <label className="block text-sm font-medium">Monto del servicio*</label>
        <input type="number" name="monto" value={datos.monto} onChange={handleChange}
          required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Forma de pago*</label>
        <input name="formaPago" value={datos.formaPago} onChange={handleChange}
          required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Condiciones adicionales</label>
        <textarea name="condiciones" value={datos.condiciones} onChange={handleChange}
          className="w-full p-2 border rounded-lg bg-gray-50" rows={3}/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Honorarios
      </button>

    </form>
  );
}
