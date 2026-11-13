import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { nombreRol } from "../../auth/sesion";
import { desbloquearUsuario, listarBloqueados } from "../../services/usuarios";
import Iniciales from "../../components/ui/Iniciales";
import { formatearFechaLocal, nombreCompleto } from "../../utils/formato";
import useConfirmar from "../../components/ui/useConfirmar";
import useTitulo from "../../utils/useTitulo";

export default function UsuariosBloqueados() {
  useTitulo("Usuarios bloqueados");
  const confirmar = useConfirmar();
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(null);

  const cargar = useCallback(() => {
    listarBloqueados().then(setUsuarios).catch(() => setError("No se pudo cargar la lista."));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const desbloquear = async (u) => {
    const ok = await confirmar({
      titulo: "Desbloquear usuario",
      mensaje: `¿Desbloquear a ${nombreCompleto(u)}? Podrán volver a ofrecerse contratos y verá tus datos de contacto.`,
      confirmar: "Desbloquear"
    });
    if (!ok) return;
    setProcesando(u.id);
    setError("");
    try {
      await desbloquearUsuario(u.id);
      setMensaje(`Desbloqueaste a ${nombreCompleto(u)}.`);
      cargar();
    } catch {
      setError("No se pudo desbloquear al usuario.");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Usuarios bloqueados</h1>
      <p className="text-gray-600 mt-1 mb-6">
        Con los usuarios bloqueados no pueden ofrecerse contratos, y ellos no te ven en sus búsquedas ni ven tus datos de contacto.
        Los contratos que ya tienen en común no se modifican.
      </p>

      {mensaje && <p role="status" className="mb-4 p-3 rounded-lg bg-green-50 border border-green-400 text-sm text-green-800">{mensaje}</p>}
      {error && <p role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{error}</p>}
      {!usuarios && !error && <p className="text-gray-600">Cargando…</p>}

      {usuarios?.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-600">
          No has bloqueado a ningún usuario.
          <span className="block text-sm mt-1">Puedes bloquear a alguien desde su perfil.</span>
        </div>
      )}

      {usuarios?.length > 0 && (
        <ul className="space-y-3">
          {usuarios.map((u) => (
            <li key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Link to={`/panel/usuarios/${u.id}`} className="flex items-center gap-3 min-w-0 flex-1 hover:underline">
                <Iniciales usuario={u} color="bg-gray-500" />
                <span className="min-w-0">
                  <span className="block font-semibold text-gray-800">{nombreCompleto(u)}</span>
                  <span className="block text-sm text-gray-600 truncate">{u.email} · {nombreRol(u.role)}</span>
                  <span className="block text-xs text-gray-500">Bloqueado el {formatearFechaLocal(u.bloqueadoDesde)}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => desbloquear(u)}
                disabled={procesando === u.id}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition disabled:opacity-60"
              >
                <ShieldCheck size={18} /> Desbloquear
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
