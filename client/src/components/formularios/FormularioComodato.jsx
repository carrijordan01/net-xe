import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioComodato() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    fechaTermino: "",
    bien: "",
    estadoBien: "",
    usoPermitido: "",
    lugarUso: "",
    obligaciones: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "COMODATO", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato COMODATO:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Bien entregado en comodato*</label>
        <input name="bien" value={datos.bien} onChange={handleChange}
          required className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Estado del bien*</label>
        <textarea name="estadoBien" value={datos.estadoBien}
          onChange={handleChange} required rows={2}
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Uso permitido*</label>
        <textarea name="usoPermitido" value={datos.usoPermitido}
          onChange={handleChange} required rows={2}
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Lugar donde se usará el bien</label>
        <input name="lugarUso" value={datos.lugarUso}
          onChange={handleChange} className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Obligaciones del comodatario</label>
        <textarea name="obligaciones" value={datos.obligaciones}
          onChange={handleChange} rows={2}
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Fecha de término*</label>
        <input type="date" name="fechaTermino" value={datos.fechaTermino}
          onChange={handleChange} required
          className="w-full p-2 border rounded-lg bg-gray-50"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Comodato
      </button>

    </form>
  );
}
