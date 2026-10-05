import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioSociedad() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    razonSocial: "",
    tipoSociedad: "",
    aporteSolicitante: "",
    aporteProponente: "",
    objetoSocial: "",
    administracion: "",
    domicilioLegal: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "SOCIEDAD", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato SOCIEDAD:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Razón social de la sociedad*</label>
        <input name="razonSocial" value={datos.razonSocial} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium">Tipo de sociedad*</label>
        <select name="tipoSociedad" value={datos.tipoSociedad} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg">
          <option value="">Seleccione...</option>
          <option>Sociedad de Responsabilidad Limitada</option>
          <option>Sociedad Anónima</option>
          <option>Sociedad por Acciones (SpA)</option>
          <option>Sociedad Colectiva</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Aporte Solicitante</label>
          <input name="aporteSolicitante" value={datos.aporteSolicitante}
            onChange={handleChange} className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium">Aporte Proponente</label>
          <input name="aporteProponente" value={datos.aporteProponente}
            onChange={handleChange} className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Objeto social (actividad de la sociedad)*</label>
        <textarea name="objetoSocial" value={datos.objetoSocial} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" rows="3" />
      </div>

      <div>
        <label className="block text-sm font-medium">Administración*</label>
        <textarea name="administracion" value={datos.administracion} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" rows="3" />
      </div>

      <div>
        <label className="block text-sm font-medium">Domicilio legal*</label>
        <input name="domicilioLegal" value={datos.domicilioLegal} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de sociedad
      </button>
    </form>
  );
}
