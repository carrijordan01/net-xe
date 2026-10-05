export default function SeccionPartes({ datos, handleChange }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg text-gray-800">Datos de las partes</h3>

      <div>
        <label className="block text-sm font-medium">Solicitante (nombre completo)</label>
        <input type="text" name="solicitanteNombre"
          value={datos.solicitanteNombre} onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" />
      </div>

      <div>
        <label className="block text-sm font-medium">Proponente (nombre completo)</label>
        <input type="text" name="proponenteNombre"
          value={datos.proponenteNombre} onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Fecha inicio</label>
          <input type="date" name="fechaInicio"
            value={datos.fechaInicio} onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" />
        </div>

        <div>
          <label className="block text-sm font-medium">Valor / monto (si aplica)</label>
          <input type="number" name="valor"
            value={datos.valor} onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50" />
        </div>
      </div>
    </div>
  );
}
