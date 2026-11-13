import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Building2, Mail, Send, Pencil } from "lucide-react";
import { api } from "../../api";
import { obtenerPlantilla } from "../../services/plantillas";
import { crearContrato } from "../../services/contratos";
import { obtenerUsuario } from "../../auth/sesion";
import { armarEnvio, primerError, seccionesPlantilla, validarFormulario } from "../../components/contratos/datosPlantilla";
import { SeccionesFormulario, SeccionesResumen, tarjeta } from "../../components/contratos/SeccionesContrato";
import { nombreCompleto } from "../../utils/formato";
import useConfirmar from "../../components/ui/useConfirmar";
import useTitulo from "../../utils/useTitulo";

function leerBorrador(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || null;
  } catch {
    return null;
  }
}

function guardarBorrador(clave, valores) {
  try {
    localStorage.setItem(clave, JSON.stringify(valores));
  } catch {
    // Sin almacenamiento disponible: el borrador simplemente no se conserva
  }
}

function borrarBorrador(clave) {
  try {
    localStorage.removeItem(clave);
  } catch {
    // ignorar
  }
}

function TarjetaContraparte({ contraparte, tipo }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Contraparte</p>
        <p className="font-semibold text-gray-800">{nombreCompleto(contraparte)}</p>
        <p className="text-sm text-gray-600 flex items-center gap-1 break-all"><Mail size={14} className="shrink-0" /> {contraparte.email}</p>
        {contraparte.company && (
          <p className="text-sm text-gray-600 flex items-center gap-1"><Building2 size={14} /> {contraparte.company}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link to={`/panel/crear/${tipo}/contraparte`} className="text-blue-700 hover:underline">Cambiar contraparte</Link>
        <Link to={`/panel/crear?contraparte=${contraparte.id}`} className="text-blue-700 hover:underline">Cambiar plantilla</Link>
      </div>
    </div>
  );
}

export default function CrearContrato() {
  useTitulo("Crear contrato");
  const confirmar = useConfirmar();
  const { tipoContrato, contraparteId } = useParams();
  const navigate = useNavigate();
  const usuario = obtenerUsuario();
  const claveBorrador = `netxe:borrador:${usuario.id}:${tipoContrato}:${contraparteId}`;

  const [plantilla, setPlantilla] = useState(null);
  const [contraparte, setContraparte] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [valores, setValores] = useState(null);
  const [errores, setErrores] = useState({});
  const [paso, setPaso] = useState("formulario");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    Promise.all([obtenerPlantilla(tipoContrato), api.get(`/usuarios/${contraparteId}`).then((r) => r.data)])
      .then(([p, u]) => {
        if (u.role !== "CONTRAPARTE") {
          setErrorCarga("El usuario seleccionado no es una contraparte.");
          return;
        }
        if (u.bloqueadoPorMi || u.meBloqueo) {
          setErrorCarga(u.bloqueadoPorMi ? "Bloqueaste a este usuario. Desbloquéalo desde su perfil para ofrecerle un contrato." : "No puedes ofrecer contratos a este usuario.");
          return;
        }
        setPlantilla(p);
        setContraparte(u);
        setValores(leerBorrador(claveBorrador) ?? { modalidad: p.modalidadSugerida ?? "" });
      })
      .catch((err) => {
        setErrorCarga(
          err.response?.status === 404 ? "No encontramos la plantilla o la contraparte indicada." : "No se pudo cargar el formulario."
        );
      });
  }, [tipoContrato, contraparteId, claveBorrador]);

  // El borrador se guarda solo después de que el usuario modifica algún dato
  useEffect(() => {
    if (valores && tocado) guardarBorrador(claveBorrador, valores);
  }, [valores, tocado, claveBorrador]);

  const secciones = useMemo(() => (plantilla ? seccionesPlantilla(plantilla) : []), [plantilla]);

  if (errorCarga) {
    return (
      <div className="max-w-3xl mx-auto">
        <p className="text-red-600 mb-4">{errorCarga}</p>
        <Link to="/panel/crear" className="text-blue-700 hover:underline">Volver al catálogo</Link>
      </div>
    );
  }
  if (!plantilla || !valores) return <p className="text-gray-600">Cargando formulario…</p>;

  const cambiar = (nombre, valor) => {
    setTocado(true);
    setValores((v) => ({ ...v, [nombre]: valor }));
    if (errores[nombre]) setErrores((e) => ({ ...e, [nombre]: undefined }));
  };

  const enfocar = (nombre) => {
    requestAnimationFrame(() => document.getElementById(`campo-${nombre}`)?.focus());
  };

  const revisar = (e) => {
    e.preventDefault();
    setErrorEnvio("");
    const nuevos = validarFormulario(plantilla, valores);
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      enfocar(primerError(plantilla, nuevos));
      return;
    }
    setPaso("revision");
    window.scrollTo({ top: 0 });
  };

  const enviar = async () => {
    setEnviando(true);
    setErrorEnvio("");
    try {
      const contrato = await crearContrato({ ...armarEnvio(plantilla, valores), contraparteId: contraparte.id });
      borrarBorrador(claveBorrador);
      navigate(`/panel/contrato/${contrato.id}`, {
        replace: true,
        state: { mensaje: `Contrato enviado a ${nombreCompleto(contraparte)}. Te avisaremos cuando lo revise.` }
      });
    } catch (err) {
      const erroresServidor = err.response?.data?.errores;
      setErrorEnvio(err.response?.data?.error || "No se pudo enviar el contrato. Intenta nuevamente.");
      if (erroresServidor) {
        setErrores(erroresServidor);
        setPaso("formulario");
        enfocar(primerError(plantilla, erroresServidor));
      }
      setEnviando(false);
    }
  };

  const descartar = async () => {
    const ok = await confirmar({
      titulo: "Descartar datos",
      mensaje: "¿Descartar los datos ingresados en este formulario? No se podrán recuperar.",
      confirmar: "Descartar",
      peligro: true
    });
    if (!ok) return;
    borrarBorrador(claveBorrador);
    setValores({ modalidad: plantilla.modalidadSugerida ?? "" });
    setTocado(false);
    setErrores({});
  };

  const encabezado = (
    <>
      <p className="text-sm text-green-600 font-semibold">{paso === "formulario" ? "Paso 1 de 2 · Completar datos" : "Paso 2 de 2 · Revisar y enviar"}</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mt-1">{plantilla.nombre}</h1>
      <p className="text-gray-600 mt-1 mb-6">{plantilla.descripcion}</p>
    </>
  );

  if (paso === "revision") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>{encabezado}</div>

        {errorEnvio && <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{errorEnvio}</p>}

        <section className={tarjeta}>
          <h2 className="font-semibold text-gray-800 mb-3">Partes</h2>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Solicitante</dt>
              <dd className="font-medium text-gray-800">{nombreCompleto(usuario)}</dd>
              <dd className="text-gray-600 break-all">{usuario.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Contraparte</dt>
              <dd className="font-medium text-gray-800">{nombreCompleto(contraparte)}</dd>
              <dd className="text-gray-600 break-all">{contraparte.email}</dd>
            </div>
          </dl>
        </section>

        <SeccionesResumen secciones={secciones} valores={valores} modalidades={plantilla.modalidades} />

        <div className={`${tarjeta} bg-green-50`}>
          <p className="text-sm text-gray-700">
            Al enviar, <b>{nombreCompleto(contraparte)}</b> recibirá este contrato para revisarlo y aceptarlo o rechazarlo.
            Podrás editarlo o eliminarlo mientras ninguna de las partes lo haya firmado.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => { setPaso("formulario"); window.scrollTo({ top: 0 }); }}
              disabled={enviando}
              className="flex items-center justify-center gap-2 px-5 py-2 border-2 border-blue-700 text-blue-700 font-semibold rounded-lg hover:bg-blue-700 hover:text-white transition disabled:opacity-60"
            >
              <Pencil size={18} /> Volver a editar
            </button>
            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-60"
            >
              <Send size={18} /> {enviando ? "Enviando…" : "Enviar contrato"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {encabezado}

      <div className="space-y-6">
        <TarjetaContraparte contraparte={contraparte} tipo={plantilla.tipo} />

        {plantilla.advertencia && (
          <p className="flex gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle size={18} className="shrink-0" />
            {plantilla.advertencia}
          </p>
        )}

        {errorEnvio && <p role="alert" className="p-3 rounded-lg bg-red-50 border border-red-300 text-sm text-red-700">{errorEnvio}</p>}

        <form onSubmit={revisar} noValidate className="space-y-6">
          <SeccionesFormulario secciones={secciones} valores={valores} errores={errores} onChange={cambiar} />

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <button type="button" onClick={descartar} className="px-5 py-2 text-sm text-gray-600 hover:text-red-600">
              Descartar datos
            </button>
            <button type="submit" className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
              Revisar contrato
            </button>
          </div>
          <p className="text-xs text-gray-500 text-right">Los datos se guardan en este navegador mientras completas el formulario.</p>
        </form>
      </div>
    </div>
  );
}
