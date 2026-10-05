import { useState } from "react";

export default function FiltrosContratos({ onBuscar }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [estado, setEstado] = useState("TODOS");

  const aplicar = () => {
    onBuscar({ q, tipo, estado });
  };

  return (
    <div className="bg-gray-100 p-4 rounded-xl mb-4 flex flex-col gap-4">
      
      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar por título o descripción..."
        className="border p-2 rounded w-full"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {/* SELECTS */}
      <div className="flex gap-4">
        <select
          className="border p-2 rounded"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
        >
          <option value="TODOS">Todos los tipos</option>
          <option value="LABORAL">Laboral</option>
          <option value="SERVICIOS">Servicios</option>
          <option value="COMPRAVENTA">Compraventa</option>
          <option value="CIVIL">Civil</option>
          {/* Agregar más si tienes más tipos */}
        </select>

        <select
          className="border p-2 rounded"
          value={estado}
          onChange={e => setEstado(e.target.value)}
        >
          <option value="TODOS">Todos</option>
          <option value="FIRMADO">Firmado</option>
          <option value="NO_FIRMADO">Pendiente</option>
        </select>

        <button
          onClick={aplicar}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Filtrar
        </button>
      </div>

    </div>
  );
}
