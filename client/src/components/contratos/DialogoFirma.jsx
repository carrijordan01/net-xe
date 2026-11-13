import { useEffect, useState } from "react";
import { Fingerprint, Lock, PenLine } from "lucide-react";
import Dialogo from "../ui/Dialogo";
import { obtenerCuenta, guardarPin } from "../../services/cuenta";
import { firmarContrato } from "../../services/contratos";

const claseInput =
  "w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none";

function CampoPin({ id, etiqueta, valor, onChange, ayuda }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">{etiqueta}</label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={valor}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className={`${claseInput} tracking-[0.5em] font-mono`}
        placeholder="••••••"
      />
      {ayuda && <p className="mt-1 text-xs text-gray-500">{ayuda}</p>}
    </div>
  );
}

// Firma electrónica simple: casilla de aceptación + contraseña + PIN.
// Si el usuario aún no tiene PIN, lo crea en el mismo paso.
export default function DialogoFirma({ abierto, contrato, titulo, onCerrar, onFirmado }) {
  const [cuenta, setCuenta] = useState(null);
  const [acepto, setAcepto] = useState(false);
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirmacion, setPinConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [firmando, setFirmando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setAcepto(false);
    setPassword("");
    setPin("");
    setPinConfirmacion("");
    setError("");
    setCuenta(null);
    obtenerCuenta()
      .then(setCuenta)
      .catch(() => setError("No se pudo verificar tu cuenta. Intenta nuevamente."));
  }, [abierto]);

  const creaPin = cuenta && !cuenta.tienePin;

  const firmar = async (e) => {
    e.preventDefault();
    setError("");
    if (!acepto) return setError("Debes marcar la casilla de aceptación para firmar.");
    if (!password) return setError("Ingresa tu contraseña.");
    if (pin.length !== 6) return setError("El PIN debe tener 6 dígitos.");
    if (creaPin && pin !== pinConfirmacion) return setError("Los PIN no coinciden.");

    setFirmando(true);
    try {
      if (creaPin) {
        await guardarPin({ password, pin });
        setCuenta((c) => ({ ...c, tienePin: true }));
      }
      const r = await firmarContrato(contrato.id, { acepto: true, password, pin });
      onFirmado(r);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo registrar la firma.");
      setPassword("");
      setPin("");
      setPinConfirmacion("");
    } finally {
      setFirmando(false);
    }
  };

  return (
    <Dialogo abierto={abierto} titulo="Firmar contrato" onCerrar={firmando ? () => {} : onCerrar}>
      {!cuenta && !error && <p className="text-gray-600">Preparando la firma…</p>}

      {cuenta && (
        <form onSubmit={firmar} noValidate className="space-y-4">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
            <p className="font-semibold text-gray-800 break-words">{titulo}</p>
            <p className="mt-2 flex items-start gap-2 text-gray-600">
              <Fingerprint size={16} className="shrink-0 mt-0.5" />
              <span>
                Huella del contenido (SHA-256):
                <code className="block break-all text-xs text-gray-800">{contrato.hashContenido}</code>
              </span>
            </p>
            {contrato.cantidadDocumentos > 0 && (
              <p className="mt-2 text-gray-600">
                La firma cubre también {contrato.cantidadDocumentos === 1 ? "el documento adjunto" : `los ${contrato.cantidadDocumentos} documentos adjuntos`}.
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acepto}
              onChange={(e) => setAcepto(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span>
              Declaro que leí el contrato completo y acepto su contenido. Entiendo que esta firma electrónica simple
              queda registrada con la fecha, la hora, mi dirección IP y la huella del contenido.
            </span>
          </label>

          <div>
            <label htmlFor="firma-password" className="block text-sm font-medium mb-1">Contraseña de tu cuenta</label>
            <input
              id="firma-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={claseInput}
            />
          </div>

          {creaPin ? (
            <div className="space-y-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-gray-700 flex gap-2">
                <Lock size={16} className="shrink-0 mt-0.5 text-blue-700" />
                Es tu primera firma: crea un PIN de 6 dígitos. Te lo pediremos cada vez que firmes un contrato.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <CampoPin id="firma-pin" etiqueta="Nuevo PIN de firma" valor={pin} onChange={setPin} ayuda="Evita secuencias y dígitos repetidos." />
                <CampoPin id="firma-pin-confirmacion" etiqueta="Repite el PIN" valor={pinConfirmacion} onChange={setPinConfirmacion} />
              </div>
            </div>
          ) : (
            <CampoPin id="firma-pin" etiqueta="PIN de firma" valor={pin} onChange={setPin} />
          )}

          {error && <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={firmando}
              className="px-5 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={firmando}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-60"
            >
              <PenLine size={18} /> {firmando ? "Firmando…" : "Firmar"}
            </button>
          </div>
        </form>
      )}

      {!cuenta && error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </Dialogo>
  );
}
