import useUser from "../hooks/useUser";
import PanelSolicitante from "../components/dashboard/PanelSolicitante";
import PanelProponente from "../components/dashboard/PanelProponente";
import NotificacionesCampana from "../components/dashboard/NotificacionesCampana";

export default function Dashboard() {
  const user = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        Cargando tu panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto bg-white border-2 border-green-400 rounded-2xl shadow-md p-6">

        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Bienvenido, {user.nombre} {user.apellido}
            </h1>
            <p className="text-gray-600">
              Tipo de usuario: <span className="font-semibold">{user.role}</span>
            </p>
          </div>
          <NotificacionesCampana />

        </div>
        {user.role === "SOLICITANTE" && <PanelSolicitante />}
        {user.role === "PROPONENTE" && <PanelProponente />}

      </div>
    </div>
  );
}
