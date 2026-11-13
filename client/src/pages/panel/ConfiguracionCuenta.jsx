import { useCallback, useEffect, useState } from "react";
import { KeyRound, Lock, Save, UserRound } from "lucide-react";
import { actualizarUsuarioSesion, guardarSesion, obtenerUsuario } from "../../auth/sesion";
import { actualizarCuenta, cambiarPassword, guardarPin, obtenerCuenta } from "../../services/cuenta";
import { tarjeta } from "../../components/contratos/SeccionesContrato";
import { formatearFechaHora } from "../../utils/formato";
import useTitulo from "../../utils/useTitulo";

const claseInput = (error) =>
  `w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none ${error ? "border-red-400" : "border-gray-300"}`;
const boton =
  "inline-flex items-center justify-center gap-2 px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-60";

function Campo({ id, etiqueta, error, ayuda, opcional, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {etiqueta}
        {opcional && <span className="text-gray-400 font-normal"> (opcional)</span>}
      </label>
      <input id={id} aria-invalid={Boolean(error)} className={claseInput(error)} {...props} />
      {ayuda && !error && <p className="mt-1 text-xs text-gray-500">{ayuda}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Aviso({ tipo, children }) {
  if (!children) return null;
  return (
    <p role={tipo === "exito" ? "status" : "alert"} className={`p-3 rounded-lg text-sm border ${
      tipo === "exito" ? "bg-green-50 border-green-400 text-green-800" : "bg-red-50 border-red-300 text-red-700"
    }`}>
      {children}
    </p>
  );
}

// Formularios independientes: cada uno muestra su propio resultado
function useFormulario(inicial) {
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState({ enviando: false, exito: "", error: "" });
  const cambiar = (e) => {
    const { name, value } = e.target;
    setValores((v) => ({ ...v, [name]: value }));
    if (errores[name]) setErrores((x) => ({ ...x, [name]: undefined }));
  };
  const enviar = async (accion) => {
    setEstado({ enviando: true, exito: "", error: "" });
    try {
      const exito = await accion();
      setEstado({ enviando: false, exito, error: "" });
    } catch (err) {
      setErrores(err.response?.data?.errores ?? {});
      setEstado({ enviando: false, exito: "", error: err.response?.data?.error || "No se pudo guardar." });
    }
  };
  return { valores, setValores, errores, setErrores, estado, cambiar, enviar };
}

function DatosPersonales({ cuenta }) {
  const f = useFormulario({
    nombre: cuenta.firstName,
    apellido: cuenta.lastName,
    telefono: cuenta.phone ?? "",
    compania: cuenta.company ?? ""
  });

  const guardar = (e) => {
    e.preventDefault();
    const errores = {};
    if (!f.valores.nombre.trim()) errores.nombre = "Ingresa tu nombre.";
    if (!f.valores.apellido.trim()) errores.apellido = "Ingresa tu apellido.";
    f.setErrores(errores);
    if (Object.keys(errores).length > 0) return;

    f.enviar(async () => {
      const r = await actualizarCuenta(f.valores);
      // Se conservan los datos de la sesión y se actualizan los editados
      actualizarUsuarioSesion({ ...obtenerUsuario(), ...r.user });
      return "Tus datos se actualizaron.";
    });
  };

  return (
    <form onSubmit={guardar} noValidate className={`${tarjeta} space-y-4`}>
      <h2 className="flex items-center gap-2 font-semibold text-gray-800"><UserRound size={20} className="text-blue-700" /> Datos personales</h2>
      <Aviso tipo="exito">{f.estado.exito}</Aviso>
      <Aviso>{f.estado.error}</Aviso>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="nombre" name="nombre" etiqueta="Nombre" value={f.valores.nombre} onChange={f.cambiar} error={f.errores.nombre} autoComplete="given-name" />
        <Campo id="apellido" name="apellido" etiqueta="Apellido" value={f.valores.apellido} onChange={f.cambiar} error={f.errores.apellido} autoComplete="family-name" />
        <Campo id="telefono" name="telefono" type="tel" etiqueta="Teléfono" opcional value={f.valores.telefono} onChange={f.cambiar} error={f.errores.telefono} autoComplete="tel" placeholder="+56 9 1234 5678" />
        <Campo
          id="compania" name="compania" etiqueta="Empresa" opcional value={f.valores.compania} onChange={f.cambiar} error={f.errores.compania}
          autoComplete="organization" ayuda="Si representas a una empresa, tu cuenta será de empresa."
        />
      </div>
      <div>
        <p className="text-sm text-gray-500">Correo: <span className="text-gray-800">{cuenta.email}</span></p>
        <p className="text-xs text-gray-500">El correo es tu identificador para iniciar sesión y no se puede cambiar.</p>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={f.estado.enviando} className={boton}>
          <Save size={18} /> {f.estado.enviando ? "Guardando…" : "Guardar datos"}
        </button>
      </div>
    </form>
  );
}

function CambiarPassword() {
  const vacio = { actual: "", nueva: "", confirmacion: "" };
  const f = useFormulario(vacio);

  const guardar = (e) => {
    e.preventDefault();
    const errores = {};
    if (!f.valores.actual) errores.actual = "Ingresa tu contraseña actual.";
    if (f.valores.nueva.length < 8) errores.nueva = "Debe tener al menos 8 caracteres.";
    if (f.valores.confirmacion !== f.valores.nueva) errores.confirmacion = "Las contraseñas no coinciden.";
    f.setErrores(errores);
    if (Object.keys(errores).length > 0) return;

    f.enviar(async () => {
      const r = await cambiarPassword({ actual: f.valores.actual, nueva: f.valores.nueva });
      // El servidor cierra las demás sesiones y entrega un token nuevo para esta
      guardarSesion(r.token, obtenerUsuario());
      f.setValores(vacio);
      return "Tu contraseña se actualizó. Cerramos las sesiones abiertas en otros dispositivos.";
    });
  };

  return (
    <form onSubmit={guardar} noValidate className={`${tarjeta} space-y-4`}>
      <h2 className="flex items-center gap-2 font-semibold text-gray-800"><Lock size={20} className="text-blue-700" /> Cambiar contraseña</h2>
      <Aviso tipo="exito">{f.estado.exito}</Aviso>
      <Aviso>{f.estado.error}</Aviso>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo id="actual" name="actual" type="password" etiqueta="Contraseña actual" value={f.valores.actual} onChange={f.cambiar} error={f.errores.actual} autoComplete="current-password" />
        <Campo id="nueva" name="nueva" type="password" etiqueta="Nueva contraseña" value={f.valores.nueva} onChange={f.cambiar} error={f.errores.nueva} autoComplete="new-password" ayuda="Mínimo 8 caracteres." />
        <Campo id="confirmacion" name="confirmacion" type="password" etiqueta="Repite la nueva" value={f.valores.confirmacion} onChange={f.cambiar} error={f.errores.confirmacion} autoComplete="new-password" />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={f.estado.enviando} className={boton}>
          <Lock size={18} /> {f.estado.enviando ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}

function PinFirma({ cuenta, onCambio }) {
  const vacio = { password: "", pinActual: "", pin: "", confirmacion: "" };
  const f = useFormulario(vacio);
  const soloDigitos = (e) => f.cambiar({ target: { name: e.target.name, value: e.target.value.replace(/\D/g, "").slice(0, 6) } });

  const guardar = (e) => {
    e.preventDefault();
    const errores = {};
    if (!f.valores.password) errores.password = "Ingresa tu contraseña.";
    if (cuenta.tienePin && f.valores.pinActual.length !== 6) errores.pinActual = "Ingresa tu PIN actual de 6 dígitos.";
    if (f.valores.pin.length !== 6) errores.pin = "El PIN debe tener 6 dígitos.";
    if (f.valores.confirmacion !== f.valores.pin) errores.confirmacion = "Los PIN no coinciden.";
    f.setErrores(errores);
    if (Object.keys(errores).length > 0) return;

    f.enviar(async () => {
      const r = await guardarPin({ password: f.valores.password, pin: f.valores.pin, pinActual: cuenta.tienePin ? f.valores.pinActual : undefined });
      f.setValores(vacio);
      onCambio();
      return r.message;
    });
  };

  const pinProps = { type: "password", inputMode: "numeric", autoComplete: "off", maxLength: 6, placeholder: "••••••", onChange: soloDigitos };

  return (
    <form onSubmit={guardar} noValidate className={`${tarjeta} space-y-4`}>
      <h2 className="flex items-center gap-2 font-semibold text-gray-800">
        <KeyRound size={20} className="text-blue-700" /> {cuenta.tienePin ? "Cambiar PIN de firma" : "Crear PIN de firma"}
      </h2>
      <p className="text-sm text-gray-600">
        El PIN de 6 dígitos se pide, junto con tu contraseña, cada vez que firmas un contrato. Tras 5 intentos fallidos,
        la firma se bloquea durante 15 minutos.
      </p>
      {cuenta.firmaBloqueadaHasta && (
        <Aviso>Tu firma está bloqueada por intentos fallidos hasta el {formatearFechaHora(cuenta.firmaBloqueadaHasta)}.</Aviso>
      )}
      <Aviso tipo="exito">{f.estado.exito}</Aviso>
      <Aviso>{f.estado.error}</Aviso>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="pin-password" name="password" type="password" etiqueta="Contraseña de tu cuenta" value={f.valores.password} onChange={f.cambiar} error={f.errores.password} autoComplete="current-password" />
        {cuenta.tienePin && (
          <Campo id="pin-actual" name="pinActual" etiqueta="PIN actual" value={f.valores.pinActual} error={f.errores.pinActual} {...pinProps} />
        )}
        <Campo id="pin-nuevo" name="pin" etiqueta="Nuevo PIN" value={f.valores.pin} error={f.errores.pin} ayuda="Evita secuencias y dígitos repetidos." {...pinProps} />
        <Campo id="pin-confirmacion" name="confirmacion" etiqueta="Repite el nuevo PIN" value={f.valores.confirmacion} error={f.errores.confirmacion} {...pinProps} />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={f.estado.enviando} className={boton}>
          <KeyRound size={18} /> {f.estado.enviando ? "Guardando…" : cuenta.tienePin ? "Cambiar PIN" : "Crear PIN"}
        </button>
      </div>
    </form>
  );
}

export default function ConfiguracionCuenta() {
  useTitulo("Configurar cuenta");
  const [cuenta, setCuenta] = useState(null);
  const [error, setError] = useState("");

  const cargar = useCallback(
    () => obtenerCuenta().then(setCuenta).catch(() => setError("No se pudo cargar tu cuenta.")),
    []
  );
  useEffect(() => {
    cargar();
  }, [cargar]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!cuenta) return <p className="text-gray-600">Cargando…</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Configurar cuenta</h1>
        <p className="text-gray-600 mt-1">Actualiza tus datos y tus credenciales de acceso y de firma.</p>
      </div>
      <DatosPersonales cuenta={cuenta} />
      <CambiarPassword />
      <PinFirma cuenta={cuenta} onCambio={cargar} />
    </div>
  );
}
