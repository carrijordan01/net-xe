import { useState } from "react";
import { crearContrato } from "../../services/contratos";
import SeccionPartes from "./SeccionPartes";

export default function FormularioCompraventaInternacional() {
  const [datos, setDatos] = useState({
    solicitanteNombre: "",
    contraparteNombre: "",
    fechaInicio: "",
    producto: "",
    cantidad: "",
    incoterm: "",
    puertoSalida: "",
    puertoLlegada: "",
    transporte: "",
    seguro: "",
    precioTotal: "",
    moneda: "",
    paisOrigen: "",
    paisDestino: "",
  });

  const handleChange = (e) =>
    setDatos({ ...datos, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await crearContrato({ tipo: "COMPRAVENTA_INTERNACIONAL", datos });
      alert("Contrato creado correctamente");
    } catch (error) {
      console.error("Error al crear contrato COMPRAVENTA_INTERNACIONAL:", error);
      alert("No se pudo crear el contrato");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SeccionPartes datos={datos} handleChange={handleChange} />

      <div>
        <label className="block text-sm font-medium">Producto*</label>
        <input name="producto" value={datos.producto}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Cantidad*</label>
        <input type="number" name="cantidad" value={datos.cantidad}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">INCOTERM*</label>
        <select name="incoterm" value={datos.incoterm}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg">
          <option value="">Seleccione...</option>
          <option>EXW</option>
          <option>FOB</option>
          <option>CIF</option>
          <option>DDP</option>
          <option>FCA</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">País de origen*</label>
          <input name="paisOrigen" value={datos.paisOrigen}
            onChange={handleChange} required
            className="w-full p-2 bg-gray-50 border rounded-lg"/>
        </div>

        <div>
          <label className="block text-sm font-medium">País de destino*</label>
          <input name="paisDestino" value={datos.paisDestino}
            onChange={handleChange} required
            className="w-full p-2 bg-gray-50 border rounded-lg"/>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Puerto/Aduana de salida*</label>
        <input name="puertoSalida" value={datos.puertoSalida}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Puerto/Aduana de llegada*</label>
        <input name="puertoLlegada" value={datos.puertoLlegada}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Transporte*</label>
        <input name="transporte" value={datos.transporte}
          onChange={handleChange} required
          className="w-full p-2 bg-gray-50 border rounded-lg"
          placeholder="Marítimo, aéreo, terrestre"/>
      </div>

      <div>
        <label className="block text-sm font-medium">Seguro (opcional)</label>
        <input name="seguro" value={datos.seguro}
          onChange={handleChange}
          className="w-full p-2 bg-gray-50 border rounded-lg"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Precio total*</label>
          <input type="number" name="precioTotal" value={datos.precioTotal}
            onChange={handleChange} required
            className="w-full p-2 bg-gray-50 border rounded-lg"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Moneda*</label>
          <input name="moneda" value={datos.moneda}
            onChange={handleChange} required
            className="w-full p-2 bg-gray-50 border rounded-lg"
            placeholder="USD, EUR, etc."/>
        </div>
      </div>

      <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
        Generar contrato de Compraventa Internacional
      </button>

    </form>
  );
}
