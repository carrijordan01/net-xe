import { useCallback, useState } from "react";
import Dialogo from "./Dialogo";
import { ContextoConfirmar } from "./useConfirmar";

// Muestra las confirmaciones pedidas con useConfirmar(). El primer botón
// enfocado es «Cancelar», para que Enter no confirme una acción por accidente.
export default function ConfirmacionProvider({ children }) {
  const [pedido, setPedido] = useState(null);

  const confirmar = useCallback(
    (opciones) => new Promise((resolver) => setPedido({ ...opciones, resolver })),
    []
  );

  const responder = (valor) => {
    pedido?.resolver(valor);
    setPedido(null);
  };

  return (
    <ContextoConfirmar.Provider value={confirmar}>
      {children}
      <Dialogo abierto={Boolean(pedido)} titulo={pedido?.titulo ?? ""} onCerrar={() => responder(false)} ancho="max-w-md">
        <p className="text-sm text-gray-700 whitespace-pre-line">{pedido?.mensaje}</p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => responder(false)}
            className="inline-flex items-center justify-center px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition"
          >
            {pedido?.cancelar ?? "Cancelar"}
          </button>
          <button
            type="button"
            onClick={() => responder(true)}
            className={`inline-flex items-center justify-center px-4 py-2 text-white font-semibold rounded-lg transition ${
              pedido?.peligro ? "bg-red-600 hover:bg-red-700" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {pedido?.confirmar ?? "Aceptar"}
          </button>
        </div>
      </Dialogo>
    </ContextoConfirmar.Provider>
  );
}
