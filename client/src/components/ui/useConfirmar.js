import { createContext, useContext } from "react";

export const ContextoConfirmar = createContext(null);

// Pide confirmación con una ventana propia en vez de window.confirm.
// Uso: if (!(await confirmar({ titulo, mensaje, confirmar: "Eliminar", peligro: true }))) return;
export default function useConfirmar() {
  return useContext(ContextoConfirmar);
}
