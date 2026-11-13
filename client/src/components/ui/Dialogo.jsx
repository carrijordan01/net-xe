import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// Ventana modal accesible: se cierra con Escape o al hacer clic fuera y
// devuelve el foco al elemento que la abrió.
export default function Dialogo({ abierto, titulo, onCerrar, children, ancho = "max-w-lg" }) {
  const idTitulo = useId();
  const panel = useRef(null);
  // Se guarda en una referencia para que el efecto no se repita en cada render
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  });

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement;
    const primero = panel.current?.querySelector("input, textarea, select, button:not([data-cerrar])");
    (primero ?? panel.current)?.focus();

    const alTeclear = (e) => e.key === "Escape" && cerrar.current();
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
      anterior?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={onCerrar}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={`w-full ${ancho} max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6`}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id={idTitulo} className="text-lg font-semibold text-gray-800">{titulo}</h2>
          <button type="button" data-cerrar onClick={onCerrar} aria-label="Cerrar" className="p-1 rounded-lg text-gray-500 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
