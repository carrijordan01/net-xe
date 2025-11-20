import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:4000/auth/login", {
        email,
        password,
      });

      //const { token } = res.data;
      localStorage.setItem("token", res.data.token);
      console.log("Token guardado:", res.data.token);
      alert("Inicio de sesión exitoso");
      await new Promise((r) => setTimeout(r, 200));
      //window.location.href = "/contracts";
      navigate("/contracts");

    } catch (err) {
      console.error("Error en login:", err);
      alert("Error al iniciar sesión: " + (err.response?.data?.error || "desconocido"));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border-2 border-green-400 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_#e5e7eb_1px,_transparent_1px)] bg-[size:20px_20px] opacity-40"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Iniciar sesión</h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            ¿No tienes una cuenta?{" "}
            <a href="/register" className="text-green-600 hover:underline font-semibold">
              Regístrate aquí
            </a>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Correo electrónico*</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Ingrese su correo electrónico"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Contraseña*</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="Ingrese su contraseña"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition border border-green-600 mt-4"
            >
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
