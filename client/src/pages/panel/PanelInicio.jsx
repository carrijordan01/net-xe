import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, Clock, FileCheck2, XCircle, Trash2 } from "lucide-react";
import { nombreRol, obtenerUsuario } from "../../auth/sesion";
import { buscarContratos, eliminarContrato, resumenContratos } from "../../services/contratos";
import useCatalogo from "../../components/contratos/useCatalogo";
import TarjetaContrato from "../../components/contratos/TarjetaContrato";
import { tituloContrato } from "../../components/contratos/estados";
import useConfirmar from "../../components/ui/useConfirmar";
import useTitulo from "../../utils/useTitulo";

const accesos = {
  SOLICITANTE: [
    { to: "/panel/crear", titulo: "Crear contrato", texto: "Elige una plantilla y envíala a una contraparte.", Icono: FilePlus2, destacado: true },
    { to: "/panel/contratos/pendientes", titulo: "Pendientes", texto: "Esperan revisión, aceptación o firma.", Icono: Clock, estados: ["PENDIENTE", "ACEPTADO"] },
    { to: "/panel/contratos/firmados", titulo: "Firmados", texto: "Firmados por ambas partes.", Icono: FileCheck2, estados: ["FIRMADO"] },
    { to: "/panel/contratos/eliminados", titulo: "Eliminados", texto: "Contratos que eliminaste, para consulta.", Icono: Trash2, estados: ["ELIMINADO"] }
  ],
  CONTRAPARTE: [
    { to: "/panel/contratos/pendientes", titulo: "Pendientes", texto: "Esperan tu revisión, aceptación o firma.", Icono: Clock, estados: ["PENDIENTE", "ACEPTADO"], destacado: true },
    { to: "/panel/contratos/firmados", titulo: "Firmados", texto: "Firmados por ambas partes.", Icono: FileCheck2, estados: ["FIRMADO"] },
    { to: "/panel/contratos/rechazados", titulo: "Rechazados", texto: "Contratos que decidiste no aceptar.", Icono: XCircle, estados: ["RECHAZADO"] }
  ]
};

const descripcionRol = {
  SOLICITANTE: "Desde aquí puedes crear contratos, enviarlos a una contraparte, firmarlos y gestionarlos.",
  CONTRAPARTE: "Desde aquí puedes revisar los contratos que te ofrecen, aceptarlos o rechazarlos y firmarlos."
};

export default function PanelInicio() {
  useTitulo("Inicio");
  const confirmar = useConfirmar();
  const usuario = obtenerUsuario();
  const catalogo = useCatalogo();
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    resumenContratos().then(setResumen).catch(() => {});
    buscarContratos({ limite: 6 })
      .then(setRecientes)
      .catch(() => setError("No se pudieron cargar tus contratos recientes."));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const eliminar = async (contrato) => {
    const nombre = tituloContrato(contrato, catalogo);
    const ok = await confirmar({
      titulo: "Eliminar contrato",
      mensaje: `¿Eliminar «${nombre}»? Quedará en la sección Eliminados solo para consulta.`,
      confirmar: "Eliminar",
      peligro: true
    });
    if (!ok) return;
    try {
      await eliminarContrato(contrato.id);
      setMensaje(`Se eliminó «${nombre}».`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo eliminar el contrato.");
    }
  };

  const contar = (estados) => (resumen ? estados.reduce((total, e) => total + (resumen[e] ?? 0), 0) : null);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="bg-white rounded-2xl border-2 border-green-400 shadow-sm p-6">
        <p className="text-sm text-green-600 font-semibold">Panel de {nombreRol(usuario.role)}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1">Hola, {usuario.firstName}</h1>
        <p className="text-gray-600 mt-2">{descripcionRol[usuario.role]}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accesos[usuario.role].map((a) => {
            const cantidad = a.estados ? contar(a.estados) : null;
            return (
              <Link
                key={a.to}
                to={a.to}
                className={`p-5 rounded-2xl border-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  a.destacado ? "bg-green-500 border-green-500 text-white" : "bg-white border-green-400 text-gray-800"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <a.Icono size={28} className={a.destacado ? "text-white" : "text-green-500"} />
                  {cantidad !== null && (
                    <span className={`text-2xl font-bold ${a.destacado ? "text-white" : "text-blue-800"}`}>{cantidad}</span>
                  )}
                </div>
                <h3 className="font-semibold">{a.titulo}</h3>
                <p className={`text-sm mt-1 ${a.destacado ? "text-green-50" : "text-gray-600"}`}>{a.texto}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Contratos recientes</h2>
          <Link to="/panel/contratos" className="text-sm text-blue-700 hover:underline">Ver todos</Link>
        </div>

        {mensaje && <p role="status" className="mb-4 p-3 rounded-lg bg-green-50 border border-green-400 text-sm text-green-800">{mensaje}</p>}
        {error && <p role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{error}</p>}

        {!recientes && !error && <p className="text-gray-600">Cargando contratos…</p>}

        {recientes?.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-600">
            {usuario.role === "SOLICITANTE" ? (
              <>
                Aún no has creado contratos.
                <Link to="/panel/crear" className="block w-fit mx-auto mt-4 px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
                  Crear mi primer contrato
                </Link>
              </>
            ) : (
              "Aún no has recibido contratos. Aparecerán aquí cuando un solicitante te ofrezca uno."
            )}
          </div>
        )}

        {recientes?.length > 0 && (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
            {recientes.map((c) => (
              <TarjetaContrato key={c.id} contrato={c} rol={usuario.role} catalogo={catalogo} onEliminar={eliminar} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
