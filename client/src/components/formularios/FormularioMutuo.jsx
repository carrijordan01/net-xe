import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioMutuo() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    monto: "",
    interes: "",
    fechaDevolucion: "",
    formaPago: "",
    garantia: "",
  });

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "MUTUO", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato MUTUO:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Monto prestado*</label>
        <input type="number" name="monto" value={datos.monto} onChange={handleChange}
          required className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium">Interés (%)</label>
        <input type="number" name="interes" value={datos.interes} onChange={handleChange}
          className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" placeholder="0 si no aplica" />
      </div>

      <div>
        <label className="block text-sm font-medium">Fecha de devolución*</label>
        <input type="date" name="fechaDevolucion" value={datos.fechaDevolucion}
          onChange={handleChange} required
          className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" />
      </div>

      <div>
        <label className="block text-sm font-medium">Forma de pago</label>
        <textarea name="formaPago" value={datos.formaPago} onChange={handleChange}
          className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" rows="2" />
      </div>

      <div>
        <label className="block text-sm font-medium">Garantía (opcional)</label>
        <textarea name="garantia" value={datos.garantia} onChange={handleChange}
          className="w-full p-2 border bg-gray-50 border-gray-300 rounded-lg" rows="2" />
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Mutuo
      </button>
    </form>
  );
}
