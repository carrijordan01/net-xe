import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function SeleccionarProponente() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const { tipoContrato } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await axios.get("http://localhost:4000/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setUsuarios(res.data);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
      }
    };

    fetchUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((u) =>
    `${u.nombre} ${u.apellido} ${u.email}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const handleSeleccion = (userId) => {
    navigate(`/crear-contrato/${tipoContrato}/${userId}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-blue-900 text-white p-6">
        <h2 className="text-xl font-bold">Net-Xe</h2>
      </div>

      <div className="flex-1 p-8">

        <h1 className="text-3xl font-bold text-blue-700 mb-6">
          Seleccionar Proponente
        </h1>

        <input
          type="text"
          placeholder="Buscar usuario..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-3 mb-6 border rounded-lg bg-white shadow"
        />

        <div className="space-y-4">
          {usuariosFiltrados.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow border"
            >
              <div>
                <p className="text-lg font-semibold">{u.nombre} {u.apellido}</p>
                <p className="text-gray-600 text-sm">{u.email}</p>
                <p className="text-gray-400 text-xs">{u.tipoCuenta}</p>
                <p className="text-gray-400 text-xs">Rol: {u.role}</p>
              </div>

              <button
                onClick={() => handleSeleccion(u.id)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Seleccionar
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
