import { useState } from "react";
import { api } from "../api";

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    compania: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    esEmpresa: false,
    role: "CONTRAPARTE",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      await api.post("/auth/register", {
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido: formData.apellido,
        compania: formData.esEmpresa ? formData.compania : null,
        telefono: formData.telefono,
        role: formData.role,
      });

      alert("Registro exitoso. Redirigiendo al inicio de sesión...");
      window.location.href = "/login";
    } catch (err) {
      alert("Error al registrar: " + (err.response?.data?.error || "desconocido"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md border-2 border-green-400 p-8 relative overflow-hidden">
        {/* Fondo de puntos */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] bg-[size:20px_20px] opacity-40"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Registro de usuario
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            ¿Ya tienes una cuenta?{" "}
            <a href="/login" className="text-green-600 hover:underline font-semibold">
              Inicia sesión
            </a>
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Nombre*</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="Ingrese su nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Apellido*</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="Ingrese su apellido"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Correo electrónico*</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Ingrese su correo electrónico"
              />
            </div>

            {/* Checkbox empresa */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="esEmpresa"
                checked={formData.esEmpresa}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label className="text-sm text-gray-700">Soy una empresa</label>
            </div>

            {/* Campos adicionales para empresa */}
            {formData.esEmpresa && (
              <div>
                <label className="block text-sm font-medium">Nombre de compañía*</label>
                <input
                  type="text"
                  name="compania"
                  value={formData.compania}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  placeholder="Ingrese el nombre de su compañía"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium">Número telefónico (opcional)</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Ingrese su número telefónico"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Tipo de usuario*</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                >
              <option value="SOLICITANTE">Solicitante (crea/solicita contratos)</option>
              <option value="CONTRAPARTE">Contraparte (ofrece servicios)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Contraseña*</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Ingrese su contraseña"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Confirmar contraseña*</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Confirme su contraseña"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600 mt-4"
            >
              Registrarme
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
