import { useState } from "react";
import { useNavigate } from "react-router-dom";


const PLANTILLAS = [
  {
    id: "laboral-indefinido",
    titulo: "Contrato laboral indefinido",
    categoria: "Contratos Laborales / Empleabilidad",
    descripcion:
      "Relacion laboral sin plazo de termino definido, regulada por el Codigo del Trabajo.",
  },
  {
    id: "laboral-plazo-fijo",
    titulo: "Contrato laboral a plazo fijo",
    categoria: "Contratos Laborales / Empleabilidad",
    descripcion:
      "Vinculacion laboral con fecha de termino previamente establecida.",
  },
  {
    id: "laboral-obra-faena",
    titulo: "Contrato por obra o faena",
    categoria: "Contratos Laborales / Empleabilidad",
    descripcion:
      "Contrato asociado a la realizacion de una obra o proyecto especifico.",
  },
  {
    id: "laboral-parcial",
    titulo: "Contrato de jornada parcial",
    categoria: "Contratos Laborales / Empleabilidad",
    descripcion:
      "Relacion laboral con jornada reducida respecto a la jornada completa.",
  },
  {
    id: "laboral-reemplazo",
    titulo: "Contrato de reemplazo",
    categoria: "Contratos Laborales / Empleabilidad",
    descripcion:
      "Contrato destinado a reemplazar temporalmente a otro trabajador.",
  },
  {
    id: "laboral-aprendizaje",
    titulo: "Contrato de aprendizaje",
    categoria: "Contratos Laborales / Empleabilidad",
    descripcion:
      "Vinculacion con fines formativos, combinando formacion y trabajo.",
  },
  {
    id: "laboral-honorarios",
    titulo: "Contrato a honorarios",
    categoria: "Contratos Laborales / Empleabilidad",
    descripcion:
      "Prestacion de servicios de manera independiente, comun en contextos profesionales.",
  },
  {
    id: "servicios-profesionales",
    titulo: "Contrato de servicios profesionales",
    categoria: "Prestacion de Servicios (Codigo Civil)",
    descripcion:
      "Prestacion de servicios especializados por parte de un profesional independiente.",
  },
  {
    id: "mandato",
    titulo: "Contrato de mandato",
    categoria: "Prestacion de Servicios (Codigo Civil)",
    descripcion:
      "Una persona encarga a otra la realizacion de actos en su nombre y representacion.",
  },
  {
    id: "arrendamiento-servicios",
    titulo: "Contrato de arrendamiento de servicios",
    categoria: "Prestacion de Servicios (Codigo Civil)",
    descripcion:
      "Contrato mediante el cual se contrata la ejecucion de servicios tecnicos o de apoyo.",
  },
  {
    id: "compraventa-mueble",
    titulo: "Compraventa de bienes muebles",
    categoria: "Contratos de Compraventa",
    descripcion:
      "Venta de bienes muebles tales como maquinaria, equipos, mobiliario, entre otros.",
  },
  {
    id: "compraventa-inmueble",
    titulo: "Compraventa de bienes inmuebles",
    categoria: "Contratos de Compraventa",
    descripcion:
      "Acuerdo de compraventa sobre propiedades o bienes raices.",
  },
  {
    id: "compraventa-comercial",
    titulo: "Compraventa comercial",
    categoria: "Contratos de Compraventa",
    descripcion:
      "Contrato de compraventa en el contexto del comercio y actividades empresariales.",
  },
  {
    id: "arriendo-inmueble",
    titulo: "Arriendo de inmueble",
    categoria: "Contratos de Arriendo",
    descripcion:
      "Arrendamiento de casas, departamentos, oficinas u otros inmuebles.",
  },
  {
    id: "arriendo-mueble",
    titulo: "Arriendo de bien mueble",
    categoria: "Contratos de Arriendo",
    descripcion:
      "Arrendamiento de vehiculos, equipos u otros bienes muebles.",
  },
  {
    id: "colaboracion",
    titulo: "Acuerdo de colaboracion",
    categoria: "Otros Contratos Civiles",
    descripcion:
      "Acuerdo entre partes para colaborar en proyectos o iniciativas especificas.",
  },
  {
    id: "simple-personalizado",
    titulo: "Contrato simple personalizado",
    categoria: "Otros Contratos Civiles",
    descripcion:
      "Plantilla generica para redactar acuerdos particulares entre partes.",
  },
  {
    id: "contrato-marco",
    titulo: "Contrato marco",
    categoria: "Otros Contratos Civiles",
    descripcion:
      "Contrato base que regula condiciones generales para multiples acuerdos futuros.",
  },
];

export default function CrearContrato() {
  const [seleccionado, setSeleccionado] = useState(null);

  const handleSeleccionar = (id) => {
    setSeleccionado(id === seleccionado ? null : id);
  };
  
  const navigate = useNavigate();
  const handleCrear = () => {
    if (!seleccionado) {
      alert("Selecciona primero una plantilla de contrato.");
      return;
    }
    navigate(`/crear-contrato/${seleccionado}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-24 bg-blue-900 flex flex-col items-center py-6 space-y-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow">
          <span className="font-bold text-xs">Net-Xe</span>
        </div>

        <button className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-md">
          <span className="text-white text-2xl">+</span>
        </button>

        <button className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center shadow-inner">
          <span className="text-2xl">{">"}</span>
        </button>

        <button className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center shadow-inner">
          <span className="text-2xl">"</span>
        </button>

        <button className="relative w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center shadow-inner">
          <span className="text-2xl">!</span>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            2
          </span>
        </button>

        <button className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center shadow-inner mt-auto mb-4">
          <span className="text-2xl">?</span>
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col">
        {/* HEADER SUPERIOR */}
        <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">Bienvenido, Usuario!</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="px-6 py-2 bg-gray-200 rounded-full text-gray-500 text-sm font-semibold">
              Tienes notificaciones pendientes
            </div>

            <button className="px-4 py-2 bg-red-500 text-white rounded-full font-semibold">
              !
            </button>

            <button className="px-4 py-2 border-2 border-blue-600 text-blue-700 font-semibold rounded-xl bg-white">
              Cerrar sesion
            </button>

            <button className="px-4 py-2 bg-green-500 text-white font-semibold rounded-xl border border-green-600">
              Perfil de usuario
            </button>
          </div>
        </header>

        {/* LINEA SEPARADORA */}
        <div className="h-1 bg-blue-100" />

        {/* LISTA DE PLANTILLAS */}
        <main className="flex-1 overflow-y-auto px-10 py-6 bg-gray-200">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Selecciona el tipo de contrato que deseas crear
            </h2>
            <p className="text-sm text-gray-600">
              Podras completar los datos especificos en el siguiente paso.
            </p>
          </div>

          <div className="space-y-4">
            {PLANTILLAS.map((plantilla) => (
              <div
                key={plantilla.id}
                className="bg-white rounded-3xl shadow flex flex-col md:flex-row items-start md:items-center px-6 py-4"
              >
                {/* Checkbox + expandir */}
                <div className="flex items-center space-x-3 w-full md:w-auto mb-3 md:mb-0">
                  <button
                    className="w-5 h-5 border-2 border-gray-600 rounded-sm flex items-center justify-center"
                    onClick={() => handleSeleccionar(plantilla.id)}
                    aria-label={`Seleccionar ${plantilla.titulo}`}
                  >
                    {seleccionado === plantilla.id && (
                      <span className="w-3 h-3 bg-blue-600 block" />
                    )}
                  </button>
                  <span className="text-sm text-gray-800">Seleccionar</span>
                  <button className="text-sm text-gray-700 underline">Expandir</button>
                </div>

                {/* Titulo centrado */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {plantilla.categoria}
                  </p>
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">
                    {plantilla.titulo}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {plantilla.descripcion}
                  </p>
                </div>

                {/* Menu / accion al lado derecho */}
                <div className="flex flex-col items-end justify-between h-full mt-3 md:mt-0 md:ml-4">
                  <button className="text-2xl text-gray-500 leading-none">...</button>
                  <button
                    onClick={() => handleSeleccionar(plantilla.id)}
                    className="mt-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold hover:bg-green-600 transition"
                  >
                    Usar esta plantilla
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Boton general para continuar */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCrear}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition"
            >
              Continuar con contrato seleccionado
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

