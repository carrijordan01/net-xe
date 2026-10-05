import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioArriendo() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    fechaTermino: "",
    valorMensual: "",
    direccionInmueble: "",
    uso: "",
    garantia: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "ARRIENDO", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato ARRIENDO:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Fecha de término*</label>
        <input type="date" name="fechaTermino" value={datos.fechaTermino} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium">Valor mensual*</label>
        <input type="number" name="valorMensual" value={datos.valorMensual} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium">Dirección del inmueble*</label>
        <input name="direccionInmueble" value={datos.direccionInmueble} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium">Uso del inmueble*</label>
        <input name="uso" value={datos.uso} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg"
          placeholder="Habitacional, comercial, bodega, etc."/>
      </div>

      <div>
        <label className="block text-sm font-medium">Garantía (opcional)</label>
        <input name="garantia" value={datos.garantia} onChange={handleChange}
          className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de arriendo
      </button>
    </form>
  );
}
