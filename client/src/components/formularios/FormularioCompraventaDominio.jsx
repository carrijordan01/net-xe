import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioCompraventaDominio() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    proponenteNombre: "",
    fechaInicio: "",
    direccionInmueble: "",
    rol: "",
    descripcion: "",
    precioVenta: "",
    formaPago: "",
    fechaEntrega: "",
    conservador: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "COMPRAVENTA_DOMINIO", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato COMPRAVENTA_DOMINIO:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Dirección del inmueble*</label>
        <input name="direccionInmueble" value={datos.direccionInmueble}
          onChange={handleChange} required
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Rol del inmueble*</label>
        <input name="rol" value={datos.rol}
          onChange={handleChange} required
          className="w-full p-2 border bg-gray-50 rounded-lg" placeholder="Ej: 12345-6"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Descripción del inmueble*</label>
        <textarea name="descripcion" value={datos.descripcion}
          onChange={handleChange} required rows={3}
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Precio de venta*</label>
          <input type="number" name="precioVenta" value={datos.precioVenta}
            onChange={handleChange} required
            className="w-full p-2 border bg-gray-50 rounded-lg"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Forma de pago*</label>
          <input name="formaPago" value={datos.formaPago}
            onChange={handleChange} required
            className="w-full p-2 border bg-gray-50 rounded-lg"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Fecha de entrega*</label>
        <input type="date" name="fechaEntrega" value={datos.fechaEntrega}
          onChange={handleChange} required
          className="w-full p-2 border bg-gray-50 rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Conservador que inscribe*</label>
        <input name="conservador" value={datos.conservador}
          onChange={handleChange} required
          className="w-full p-2 border bg-gray-50 rounded-lg" />
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Compraventa de Dominio
      </button>
    </form>
  );
}
