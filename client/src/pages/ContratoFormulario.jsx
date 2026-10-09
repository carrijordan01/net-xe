import { useParams } from "react-router-dom";
import FormularioAgencia from "../components/formularios/FormularioAgencia";
import FormularioAprendizaje from "../components/formularios/FormularioAprendizaje";
import FormularioArriendo from "../components/formularios/FormularioArriendo";
import FormularioComodato from "../components/formularios/FormularioComodato";
import FormularioCompraventaBienes from "../components/formularios/FormularioCompraventaBienes";
import FormularioCompraventaDominio from "../components/formularios/FormularioCompraventaDominio";
import FormularioCompraventaInternacional from "../components/formularios/FormularioCompraventaInternacional";
import FormularioDistribucion from "../components/formularios/FormularioDistribucion";
import FormularioDonacion from "../components/formularios/FormularioDonacion";
import FormularioEjecucionInmediata from "../components/formularios/FormularioEjecucionInmediata";
import FormularioFactoring from "../components/formularios/FormularioFactoring";
import FormularioFranquicia from "../components/formularios/FormularioFranquicia";
import FormularioHipoteca from "../components/formularios/FormularioHipoteca";
import FormularioHonorarios from "../components/formularios/FormularioHonorarios";
import FormularioIndefinido from "../components/formularios/FormularioIndefinido";
import FormularioJornadaParcial from "../components/formularios/FormularioJornadaParcial";
import FormularioLeasing from "../components/formularios/FormularioLeasing";
import FormularioMutuo from "../components/formularios/FormularioMutuo";
import FormularioObraFaena from "../components/formularios/FormularioObraFaena";
import FormularioPlazoFijo from "../components/formularios/FormularioPlazoFijo";
import FormularioReemplazo from "../components/formularios/FormularioReemplazo";
import FormularioServiciosProfesionales from "../components/formularios/FormularioServiciosProfesionales";
import FormularioSociedad from "../components/formularios/FormularioSociedad";
import FormularioSuministro from "../components/formularios/FormularioSuministro";
import FormularioTractoSucesivo from "../components/formularios/FormularioTractoSucesivo";


export default function ContratoFormulario() {

    const { tipoContrato, contraparteId, idPlantilla } = useParams();
    
    const renderFormulario = () => {
        switch (idPlantilla) {
            case "indefinido": //mantener
                return (
                <FormularioIndefinido
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "plazo-fijo": //mantener
                return (
                <FormularioPlazoFijo
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "obra-faena": //simplificar
                return (
                <FormularioObraFaena
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "jornada-parcial": //mantener
                return (
                <FormularioJornadaParcial
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "reemplazo": //simplificar
                return (
                <FormularioReemplazo
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "aprendizaje": //eliminar
                return (
                <FormularioAprendizaje
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "honorarios": //eliminar
                return (
                <FormularioHonorarios
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "servicios-profesionales": //mantener
                return (
                <FormularioServiciosProfesionales
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "compraventa-bienes": //mantener
                return (
                <FormularioCompraventaBienes
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "compraventa-dominio": //simplificar
                return (
                <FormularioCompraventaDominio
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "compraventa-internacional": //eliminar 
                return (
                <FormularioCompraventaInternacional
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "agencia": //simplificar
                return (
                <FormularioAgencia
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "distribucion": //simplificar
                return (
                <FormularioDistribucion
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "suministro": //simplificar
                return (
                <FormularioSuministro
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "sociedad"://eliminar
                return (
                <FormularioSociedad
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "franquicia": //eliminar
                return (
                <FormularioFranquicia
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "leasing": //eliminar
                return (
                <FormularioLeasing
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "factoring": //eliminar
                return (
                <FormularioFactoring
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "arriendo": //mantener
                return (
                <FormularioArriendo
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "comodato": //mantener
                return (
                <FormularioComodato
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "donacion": //simplificar
                return (
                <FormularioDonacion
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "mutuo": //simplificar
                return (
                <FormularioMutuo
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "hipoteca": //eliminar
                return (
                <FormularioHipoteca
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "ejecucion-inmediata": //mantener como modalidad
                return (
                <FormularioEjecucionInmediata
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            case "tracto-sucesivo": //mantener como modalidad
                return (
                <FormularioTractoSucesivo
                    contraparteId={contraparteId}
                    tipoContrato={tipoContrato}
                />);
            default:
                return <p>Plantilla de contrato no encontrada.</p>;
  }
};
  

  return (
    <div className="flex">
      {/* Aquí puedes volver a usar tu sidebar existente */}
      <div className="flex-1 p-6 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Formulario para {idPlantilla}
        </h1>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-300">
          {renderFormulario()}
        </div>
      </div>
    </div>
  );
}
