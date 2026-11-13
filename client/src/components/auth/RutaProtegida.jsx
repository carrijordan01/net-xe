import { Navigate, Outlet, useLocation } from "react-router-dom";
import { obtenerUsuario } from "../../auth/sesion";

// Exige sesión vigente y, si se indica, uno de los roles permitidos
export default function RutaProtegida({ roles, children }) {
  const location = useLocation();
  const usuario = obtenerUsuario();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/panel" replace />;
  }

  return children ?? <Outlet />;
}

// Para login y registro: si ya hay sesión, se va directo al panel
export function SoloInvitados({ children }) {
  return obtenerUsuario() ? <Navigate to="/panel" replace /> : children;
}
