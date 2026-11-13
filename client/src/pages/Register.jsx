import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FilePlus2, FileSignature } from "lucide-react";
import { api } from "../api";
import AuthCard, { Alerta, inputClass } from "../components/auth/AuthCard";

const tiposCuenta = [
  {
    valor: "SOLICITANTE",
    titulo: "Solicitante",
    descripcion: "Creo, envío, firmo y gestiono contratos.",
    Icono: FilePlus2
  },
  {
    valor: "CONTRAPARTE",
    titulo: "Contraparte",
    descripcion: "Recibo contratos, los reviso, acepto o rechazo y firmo.",
    Icono: FileSignature
  }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(datos) {
  const errores = {};
  if (!datos.role) errores.role = "Selecciona un tipo de cuenta.";
  if (!datos.nombre.trim()) errores.nombre = "Ingresa tu nombre.";
  if (!datos.apellido.trim()) errores.apellido = "Ingresa tu apellido.";
  if (!EMAIL_REGEX.test(datos.email.trim())) errores.email = "Ingresa un correo válido.";
  if (datos.password.length < 8) errores.password = "La contraseña debe tener al menos 8 caracteres.";
  if (datos.confirmPassword !== datos.password) errores.confirmPassword = "Las contraseñas no coinciden.";
  return errores;
}

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    compania: ""
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errores[name]) setErrores({ ...errores, [name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorServidor("");

    const nuevosErrores = validar(formData);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setEnviando(true);
    try {
      await api.post("/auth/register", {
        role: formData.role,
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim(),
        password: formData.password,
        telefono: formData.telefono.trim() || null,
        compania: formData.compania.trim() || null
      });

      setRegistrado(true);
      setTimeout(() => {
        navigate("/login", {
          state: { mensaje: "Cuenta creada. Ya puedes iniciar sesión.", email: formData.email.trim() }
        });
      }, 2500);
    } catch (err) {
      setErrorServidor(err.response?.data?.error || "No se pudo completar el registro. Intenta nuevamente.");
      setEnviando(false);
    }
  };

  if (registrado) {
    return (
      <AuthCard titulo="¡Registro exitoso!">
        <Alerta tipo="exito">
          Tu cuenta de <b>{formData.role === "SOLICITANTE" ? "Solicitante" : "Contraparte"}</b> fue creada correctamente.
          Te llevaremos al inicio de sesión en unos segundos…
        </Alerta>
        <Link
          to="/login"
          state={{ email: formData.email.trim() }}
          className="block w-full text-center py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600"
        >
          Ir a iniciar sesión
        </Link>
      </AuthCard>
    );
  }

  const error = (campo) =>
    errores[campo] && <p className="mt-1 text-xs text-red-600">{errores[campo]}</p>;

  return (
    <AuthCard
      titulo="Registro de usuario"
      ancho="max-w-lg"
      subtitulo={
        <>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="text-green-600 hover:underline font-semibold">
            Inicia sesión
          </Link>
        </>
      }
    >
      <Alerta>{errorServidor}</Alerta>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <fieldset>
          <legend className="block text-sm font-medium mb-2">Tipo de cuenta*</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tiposCuenta.map((tipo) => {
              const { valor, titulo, descripcion } = tipo;
              const activo = formData.role === valor;
              return (
                <label
                  key={valor}
                  className={`flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 ${
                    activo ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-green-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={valor}
                    checked={activo}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <tipo.Icono className={activo ? "text-green-600 shrink-0" : "text-blue-700 shrink-0"} size={24} />
                  <span>
                    <span className="block font-semibold text-gray-800">{titulo}</span>
                    <span className="block text-xs text-gray-600">{descripcion}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {error("role")}
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium">Nombre*</label>
            <input id="nombre" type="text" name="nombre" value={formData.nombre} onChange={handleChange}
              autoComplete="given-name" className={inputClass} placeholder="Ingrese su nombre" />
            {error("nombre")}
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium">Apellido*</label>
            <input id="apellido" type="text" name="apellido" value={formData.apellido} onChange={handleChange}
              autoComplete="family-name" className={inputClass} placeholder="Ingrese su apellido" />
            {error("apellido")}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">Correo electrónico*</label>
          <input id="email" type="email" name="email" value={formData.email} onChange={handleChange}
            autoComplete="email" className={inputClass} placeholder="nombre@correo.cl" />
          {error("email")}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Contraseña*</label>
            <input id="password" type="password" name="password" value={formData.password} onChange={handleChange}
              autoComplete="new-password" className={inputClass} placeholder="Mínimo 8 caracteres" />
            {error("password")}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirmar contraseña*</label>
            <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} autoComplete="new-password" className={inputClass} placeholder="Repita su contraseña" />
            {error("confirmPassword")}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium">Teléfono (opcional)</label>
            <input id="telefono" type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
              autoComplete="tel" className={inputClass} placeholder="+56 9 1234 5678" />
          </div>
          <div>
            <label htmlFor="compania" className="block text-sm font-medium">Empresa (opcional)</label>
            <input id="compania" type="text" name="compania" value={formData.compania} onChange={handleChange}
              autoComplete="organization" className={inputClass} placeholder="Si representa a una empresa" />
          </div>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enviando ? "Registrando…" : "Registrarme"}
        </button>
      </form>
    </AuthCard>
  );
}
