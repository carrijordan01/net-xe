import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioLeasing() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    bienArrendado: "",
    valorBien: "",
    cuotaMensual: "",
    plazoMeses: "",
    opcionCompra: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "LEASING", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato LEASING:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Bien arrendado*</label>
        <input name="bienArrendado" value={datos.bienArrendado}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Valor del bien*</label>
          <input type="number" name="valorBien" value={datos.valorBien}
            onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Cuota mensual*</label>
          <input type="number" name="cuotaMensual" value={datos.cuotaMensual}
            onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Plazo (meses)*</label>
        <input type="number" name="plazoMeses" value={datos.plazoMeses}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Opción de compra*</label>
        <input name="opcionCompra" value={datos.opcionCompra}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"
          placeholder="Ej: Precio residual u otras condiciones"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Leasing
      </button>

    </form>
  );
}
