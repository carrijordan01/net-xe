import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioCompraventaBienes() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    descripcionBien: "",
    estadoBien: "",
    precio: "",
    formaPago: "",
    entrega: "",
    garantia: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "COMPRAVENTA_BIENES", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato COMPRAVENTA_BIENES:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Descripción del bien*</label>
        <textarea name="descripcionBien" value={datos.descripcionBien}
          onChange={handleChange} required rows={3}
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Estado del bien*</label>
        <textarea name="estadoBien" value={datos.estadoBien}
          onChange={handleChange} required rows={2}
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Precio de venta*</label>
        <input type="number" name="precio" value={datos.precio}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Forma de pago*</label>
        <input name="formaPago" value={datos.formaPago}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"
          placeholder="Transferencia, cuotas, contado..."/>
      </div>

      <div>
        <label className="block text-sm font-medium">Condiciones de entrega*</label>
        <textarea name="entrega" value={datos.entrega}
          onChange={handleChange} required rows={2}
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Garantía (si existe)</label>
        <textarea name="garantia" value={datos.garantia}
          onChange={handleChange} rows={2}
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Compraventa de Bienes
      </button>
    </form>
  );
}
