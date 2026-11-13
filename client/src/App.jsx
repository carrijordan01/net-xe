import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NoEncontrada from "./pages/NoEncontrada";
import RecuperarPassword from "./pages/RecuperarPassword";
import RestablecerPassword from "./pages/RestablecerPassword";
import RutaProtegida, { SoloInvitados } from "./components/auth/RutaProtegida";
import PanelLayout from "./components/panel/PanelLayout";
import PanelInicio from "./pages/panel/PanelInicio";
import ListaContratos from "./pages/panel/ListaContratos";
import CatalogoPlantillas from "./pages/panel/CatalogoPlantillas";
import CrearContrato from "./pages/panel/CrearContrato";
import SeleccionarContraparte from "./pages/panel/SeleccionarContraparte";
import DetalleContrato from "./pages/panel/DetalleContrato";
import EditarContrato from "./pages/panel/EditarContrato";
import BuscarUsuarios from "./pages/panel/BuscarUsuarios";
import PerfilUsuario from "./pages/panel/PerfilUsuario";
import MiPerfil from "./pages/panel/MiPerfil";
import ConfiguracionCuenta from "./pages/panel/ConfiguracionCuenta";
import UsuariosBloqueados from "./pages/panel/UsuariosBloqueados";
import CentroAyuda from "./pages/panel/CentroAyuda";

const SOLICITANTE = ["SOLICITANTE"];

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<SoloInvitados><Login /></SoloInvitados>} />
        <Route path="/register" element={<SoloInvitados><Register /></SoloInvitados>} />
        <Route path="/recuperar" element={<SoloInvitados><RecuperarPassword /></SoloInvitados>} />
        <Route path="/restablecer" element={<RestablecerPassword />} />

        <Route path="/panel" element={<RutaProtegida><PanelLayout /></RutaProtegida>}>
          <Route index element={<PanelInicio />} />

          {/* Gestión de contratos */}
          <Route path="contratos" element={<ListaContratos />} />
          <Route path="contratos/:estado" element={<ListaContratos />} />
          <Route path="contrato/:id" element={<DetalleContrato />} />

          <Route element={<RutaProtegida roles={SOLICITANTE} />}>
            <Route path="crear" element={<CatalogoPlantillas />} />
            <Route path="crear/:tipoContrato/contraparte" element={<SeleccionarContraparte />} />
            <Route path="crear/:tipoContrato/:contraparteId" element={<CrearContrato />} />
            <Route path="contrato/:id/editar" element={<EditarContrato />} />
          </Route>

          {/* Usuarios */}
          <Route path="usuarios" element={<BuscarUsuarios />} />
          <Route path="usuarios/:id" element={<PerfilUsuario />} />

          {/* Opciones de usuario y ayuda */}
          <Route path="perfil" element={<MiPerfil />} />
          <Route path="configuracion" element={<ConfiguracionCuenta />} />
          <Route path="bloqueados" element={<UsuariosBloqueados />} />
          <Route path="ayuda" element={<CentroAyuda />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Router>
  );
}

export default App;
