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

    const { tipoContrato, proponenteId, idPlantilla } = useParams();
    
    const renderFormulario = () => {
        switch (idPlantilla) {
            case "indefinido": //mantener
                return (
                <FormularioIndefinido
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "plazo-fijo": //mantener
                return (
                <FormularioPlazoFijo
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "obra-faena": //simplificar
                return (
                <FormularioObraFaena
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "jornada-parcial": //mantener
                return (
                <FormularioJornadaParcial
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "reemplazo": //simplificar
                return (
                <FormularioReemplazo
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "aprendizaje": //eliminar
                return (
                <FormularioAprendizaje
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "honorarios": //eliminar
                return (
                <FormularioHonorarios
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "servicios-profesionales": //mantener
                return (
                <FormularioServiciosProfesionales
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "compraventa-bienes": //mantener
                return (
                <FormularioCompraventaBienes
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "compraventa-dominio": //simplificar
                return (
                <FormularioCompraventaDominio
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "compraventa-internacional": //eliminar 
                return (
                <FormularioCompraventaInternacional
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "agencia": //simplificar
                return (
                <FormularioAgencia
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "distribucion": //simplificar
                return (
                <FormularioDistribucion
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "suministro": //simplificar
                return (
                <FormularioSuministro
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "sociedad"://eliminar
                return (
                <FormularioSociedad
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "franquicia": //eliminar
                return (
                <FormularioFranquicia
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "leasing": //eliminar
                return (
                <FormularioLeasing
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "factoring": //eliminar
                return (
                <FormularioFactoring
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "arriendo": //mantener
                return (
                <FormularioArriendo
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "comodato": //mantener
                return (
                <FormularioComodato
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "donacion": //simplificar
                return (
                <FormularioDonacion
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "mutuo": //simplificar
                return (
                <FormularioMutuo
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "hipoteca": //eliminar
                return (
                <FormularioHipoteca
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "ejecucion-inmediata": //mantener como modalidad
                return (
                <FormularioEjecucionInmediata
                    proponenteId={proponenteId}
                    tipoContrato={tipoContrato}
                />);
            case "tracto-sucesivo": //mantener como modalidad
                return (
                <FormularioTractoSucesivo
                    proponenteId={proponenteId}
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
