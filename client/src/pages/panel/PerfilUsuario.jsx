import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Building2, FilePlus2, Mail, Phone, ShieldCheck, UserX } from "lucide-react";
import { nombreRol, obtenerUsuario } from "../../auth/sesion";
import { bloquearUsuario, desbloquearUsuario, obtenerPerfil } from "../../services/usuarios";
import Dialogo from "../../components/ui/Dialogo";
import Iniciales from "../../components/ui/Iniciales";
import { tarjeta } from "../../components/contratos/SeccionesContrato";
import { nombreCompleto } from "../../utils/formato";
import useTitulo from "../../utils/useTitulo";

const botonPrimario =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-60";
const botonSecundario =
  "inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition disabled:opacity-60";
const botonPeligro =
  "inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-60";

export default function PerfilUsuario() {
  useTitulo("Perfil de usuario");
  const { id } = useParams();
  const navigate = useNavigate();
  const yo = obtenerUsuario();

  const [perfil, setPerfil] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [dialogo, setDialogo] = useState(null); // "ofrecer" | "bloquear" | "desbloquear"
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(() => {
    obtenerPerfil(id)
      .then(setPerfil)
      .catch((err) => setError(err.response?.status === 404 || err.response?.status === 400 ? "Este usuario no existe." : "No se pudo cargar el perfil."));
  }, [id]);

  useEffect(() => {
    setPerfil(null);
    setError("");
    setMensaje("");
    cargar();
  }, [cargar]);

  const cerrar = useCallback(() => setDialogo(null), []);

  if (Number(id) === yo.id) return <Navigate to="/panel/perfil" replace />;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/panel/usuarios" className="text-blue-700 hover:underline">Volver a buscar usuarios</Link>
      </div>
    );
  }
  if (!perfil) return <p className="text-gray-600">Cargando perfil…</p>;

  const nombre = nombreCompleto(perfil);
  const puedeOfrecer = yo.role === "SOLICITANTE" && perfil.role === "CONTRAPARTE" && !perfil.bloqueadoPorMi;

  const cambiarBloqueo = async () => {
    const bloquear = dialogo === "bloquear";
    setDialogo(null);
    setProcesando(true);
    try {
      await (bloquear ? bloquearUsuario(perfil.id) : desbloquearUsuario(perfil.id));
      setMensaje(bloquear ? `Bloqueaste a ${nombre}.` : `Desbloqueaste a ${nombre}.`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo completar la acción.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
        <ArrowLeft size={16} /> Volver
      </button>

      {mensaje && <p role="status" className="p-3 rounded-lg bg-green-50 border border-green-400 text-sm text-green-800">{mensaje}</p>}

      <section className={tarjeta}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Iniciales usuario={perfil} tamano="w-16 h-16 text-xl" color={perfil.meBloqueo ? "bg-gray-400" : "bg-blue-900"} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-blue-800 break-words">{nombre}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{nombreRol(perfil.role)}</span>
              {perfil.bloqueadoPorMi && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                  <Ban size={12} /> Bloqueado por ti
                </span>
              )}
            </div>
          </div>
        </div>

        {perfil.meBloqueo ? (
          <p className="mt-6 flex gap-2 text-sm text-gray-600">
            <UserX size={18} className="shrink-0" />
            Este usuario no está disponible. No puedes ver sus datos de contacto ni interactuar con él.
          </p>
        ) : (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-gray-500 flex items-center gap-1"><Mail size={14} /> Correo</dt>
              <dd className="text-gray-800 break-all">{perfil.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500 flex items-center gap-1"><Phone size={14} /> Teléfono</dt>
              <dd className="text-gray-800">{perfil.phone || "No informado"}</dd>
            </div>
            {perfil.company && (
              <div>
                <dt className="text-gray-500 flex items-center gap-1"><Building2 size={14} /> Empresa</dt>
                <dd className="text-gray-800">{perfil.company}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      {!perfil.meBloqueo && (
        <section className={`${tarjeta} flex flex-wrap gap-2`}>
          {puedeOfrecer && (
            <button type="button" onClick={() => setDialogo("ofrecer")} disabled={procesando} className={botonPrimario}>
              <FilePlus2 size={18} /> Ofrecer un contrato
            </button>
          )}
          {!perfil.bloqueadoPorMi && (
            <a href={`mailto:${perfil.email}?subject=${encodeURIComponent("Contacto desde Net-Xe")}`} className={botonSecundario}>
              <Mail size={18} /> Enviar correo
            </a>
          )}
          {perfil.bloqueadoPorMi ? (
            <button type="button" onClick={() => setDialogo("desbloquear")} disabled={procesando} className={botonSecundario}>
              <ShieldCheck size={18} /> Desbloquear
            </button>
          ) : (
            <button type="button" onClick={() => setDialogo("bloquear")} disabled={procesando} className={botonPeligro}>
              <Ban size={18} /> Bloquear
            </button>
          )}
        </section>
      )}

      <Dialogo abierto={dialogo === "ofrecer"} titulo="Ofrecer un contrato" onCerrar={cerrar}>
        <p className="text-sm text-gray-700">
          ¿Quieres ofrecerle un contrato a <b>{nombre}</b>? A continuación elegirás la plantilla y completarás sus datos;
          el contrato solo se enviará cuando lo confirmes al final.
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={cerrar} className={botonSecundario}>Cancelar</button>
          <button type="button" onClick={() => navigate(`/panel/crear?contraparte=${perfil.id}`)} className={botonPrimario}>
            <FilePlus2 size={18} /> Elegir plantilla
          </button>
        </div>
      </Dialogo>

      <Dialogo abierto={dialogo === "bloquear"} titulo={`Bloquear a ${nombre}`} onCerrar={cerrar}>
        <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
          <li>No podrán ofrecerse contratos entre ustedes.</li>
          <li>Dejarás de aparecer en sus búsquedas y no verá tus datos de contacto.</li>
          <li>Los contratos que ya tienen en común no se modifican.</li>
          <li>Puedes desbloquearlo cuando quieras.</li>
        </ul>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={cerrar} className={botonSecundario}>Cancelar</button>
          <button type="button" onClick={cambiarBloqueo} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
            <Ban size={18} /> Bloquear
          </button>
        </div>
      </Dialogo>

      <Dialogo abierto={dialogo === "desbloquear"} titulo={`Desbloquear a ${nombre}`} onCerrar={cerrar}>
        <p className="text-sm text-gray-700">Podrán volver a ofrecerse contratos y verás de nuevo sus datos de contacto.</p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={cerrar} className={botonSecundario}>Cancelar</button>
          <button type="button" onClick={cambiarBloqueo} className={botonPrimario}>
            <ShieldCheck size={18} /> Desbloquear
          </button>
        </div>
      </Dialogo>
    </div>
  );
}
