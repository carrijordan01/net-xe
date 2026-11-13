import { useEffect, useState } from "react";
import { obtenerCatalogo } from "../../services/plantillas";

// El catálogo no cambia mientras la app está abierta: se pide una sola vez
let cache = null;
let pendiente = null;

function cargarCatalogo() {
  if (cache) return Promise.resolve(cache);
  if (!pendiente) {
    pendiente = obtenerCatalogo()
      .then((c) => (cache = c))
      .finally(() => (pendiente = null));
  }
  return pendiente;
}

export default function useCatalogo() {
  const [catalogo, setCatalogo] = useState(cache);

  useEffect(() => {
    if (!cache) cargarCatalogo().then(setCatalogo).catch(() => {});
  }, []);

  return catalogo;
}
