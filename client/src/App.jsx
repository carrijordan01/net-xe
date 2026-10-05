import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ContratoFormulario from "./pages/ContratoFormulario";
import SeleccionarProponente from "./pages/SeleccionarProponente";
import MisContratos from "./pages/MisContratos";
import ContratosRecibidos from "./pages/ContratosRecibidos";
import DetalleContrato from "./pages/DetalleContrato";
import EditarContrato from "./pages/EditarContrato";
import FirmaContrato from "./pages/FirmaContrato";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/crear-contrato/:idPlantilla" element={<ContratoFormulario />} />
        <Route path="/seleccionar-proponente/:tipoContrato" element={<SeleccionarProponente />} />
        <Route path="/crear-contrato/:tipoContrato/:proponenteId" element={<ContratoFormulario />} />
        <Route path="/mis-contratos" element={<MisContratos />} />
        <Route path="/contratos-recibidos" element={<ContratosRecibidos />} />
        <Route path="/contrato/:id" element={<DetalleContrato />} />
        <Route path="/editar-contrato/:id" element={<EditarContrato />} />
        <Route path="/contratos/:id/firmar" element={<FirmaContrato />} />
        <Route path="/contratos/:id/firmar/proponente" element={<FirmaContrato />} />
        <Route path="/contratos/:id/firmar/solicitante" element={<FirmaContrato />} />
      </Routes>
    </Router>
  );
}

export default App;
