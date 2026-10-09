import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioFranquicia() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    marca: "",
    canonEntrada: "",
    porcentajeRoyalty: "",
    zonaExclusividad: "",
    obligacionesFranquiciado: "",
    soporteFranquiciante: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "FRANQUICIA", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato FRANQUICIA:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Marca licenciada*</label>
        <input name="marca" value={datos.marca}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Canon de entrada*</label>
          <input type="number" name="canonEntrada" value={datos.canonEntrada}
            onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Royalty (%) mensual*</label>
          <input type="number" name="porcentajeRoyalty" value={datos.porcentajeRoyalty}
            onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Zona de exclusividad*</label>
        <input name="zonaExclusividad" value={datos.zonaExclusividad}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Obligaciones del franquiciado*</label>
        <textarea name="obligacionesFranquiciado" value={datos.obligacionesFranquiciado}
          onChange={handleChange} rows={3} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Soporte del franquiciante*</label>
        <textarea name="soporteFranquiciante" value={datos.soporteFranquiciante}
          onChange={handleChange} rows={3} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Franquicia
      </button>

    </form>
  );
}
