import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioFactoring() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    empresaCedente: "",
    montoCedido: "",
    numeroFactura: "",
    fechaVencimiento: "",
    comision: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "FACTORING", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato FACTORING:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Empresa cedente*</label>
        <input name="empresaCedente" value={datos.empresaCedente}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Monto cedido*</label>
        <input type="number" name="montoCedido" value={datos.montoCedido}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Número de factura*</label>
        <input name="numeroFactura" value={datos.numeroFactura}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Fecha de vencimiento*</label>
        <input type="date" name="fechaVencimiento" value={datos.fechaVencimiento}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Comisión (%)*</label>
        <input type="number" name="comision" value={datos.comision}
          onChange={handleChange} required className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Factoring
      </button>

    </form>
  );
}
