import { useEffect } from "react";

const TITULO_BASE = "Net-Xe | Gestión de contratos";

// Título de la pestaña del navegador para la página actual
export default function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} | Net-Xe` : TITULO_BASE;
    return () => {
      document.title = TITULO_BASE;
    };
  }, [titulo]);
}
