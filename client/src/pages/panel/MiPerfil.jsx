import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarDays, KeyRound, Mail, Pencil, Phone, UserRound } from "lucide-react";
import { nombreRol } from "../../auth/sesion";
import { obtenerCuenta } from "../../services/cuenta";
import { resumenContratos } from "../../services/contratos";
import Iniciales from "../../components/ui/Iniciales";
import { tarjeta } from "../../components/contratos/SeccionesContrato";
import { ESTADOS } from "../../components/contratos/estados";
import { formatearFechaHora, formatearFechaLocal, nombreCompleto } from "../../utils/formato";
import useTitulo from "../../utils/useTitulo";

// El ícono se usa como props.Icono (ver nota de ESLint en CLAUDE.md)
function Dato(props) {
  return (
    <div>
      <dt className="text-gray-500 flex items-center gap-1"><props.Icono size={14} /> {props.etiqueta}</dt>
      <dd className="text-gray-800 break-words">{props.children}</dd>
    </div>
  );
}

export default function MiPerfil() {
  useTitulo("Mi perfil");
  const [cuenta, setCuenta] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerCuenta().then(setCuenta).catch(() => setError("No se pudo cargar tu perfil."));
    resumenContratos().then(setResumen).catch(() => {});
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!cuenta) return <p className="text-gray-600">Cargando perfil…</p>;

  const estadosVisibles = cuenta.role === "CONTRAPARTE"
    ? ["PENDIENTE", "ACEPTADO", "FIRMADO", "RECHAZADO"]
    : ["PENDIENTE", "ACEPTADO", "FIRMADO", "RECHAZADO", "ELIMINADO"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Mi perfil</h1>

      <section className={tarjeta}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Iniciales usuario={cuenta} tamano="w-16 h-16 text-xl" color="bg-green-500" />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-800 break-words">{nombreCompleto(cuenta)}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{nombreRol(cuenta.role)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                Cuenta {cuenta.accountType === "EMPRESA" ? "de empresa" : "individual"}
              </span>
            </div>
          </div>
          <Link
            to="/panel/configuracion"
            className="self-start inline-flex items-center gap-2 px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition"
          >
            <Pencil size={18} /> Editar mis datos
          </Link>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
          <Dato Icono={Mail} etiqueta="Correo">{cuenta.email}</Dato>
          <Dato Icono={Phone} etiqueta="Teléfono">{cuenta.phone || "No informado"}</Dato>
          <Dato Icono={Building2} etiqueta="Empresa">{cuenta.company || "No informada"}</Dato>
          <Dato Icono={CalendarDays} etiqueta="Miembro desde">{formatearFechaLocal(cuenta.createdAt)}</Dato>
          <Dato Icono={KeyRound} etiqueta="PIN de firma">
            {cuenta.tienePin ? "Configurado" : "Aún no lo creas (se crea en tu primera firma o en Configurar cuenta)"}
            {cuenta.firmaBloqueadaHasta && (
              <span className="block text-red-600">Firma bloqueada hasta el {formatearFechaHora(cuenta.firmaBloqueadaHasta)}</span>
            )}
          </Dato>
          <Dato Icono={UserRound} etiqueta="Rol">
            {cuenta.role === "SOLICITANTE" ? "Creas, envías, firmas y gestionas contratos." : "Recibes, revisas, aceptas o rechazas y firmas contratos."}
          </Dato>
        </dl>
      </section>

      {resumen && (
        <section className={tarjeta}>
          <h2 className="font-semibold text-gray-800 mb-4">Mis contratos</h2>
          <dl className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {estadosVisibles.map((e) => (
              <div key={e} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <dt className="text-xs text-gray-500">{ESTADOS[e].texto}</dt>
                <dd className="text-2xl font-bold text-blue-800">{resumen[e] ?? 0}</dd>
              </div>
            ))}
          </dl>
          <Link to="/panel/contratos" className="inline-block mt-4 text-sm text-blue-700 hover:underline">Ver todos mis contratos</Link>
        </section>
      )}
    </div>
  );
}
