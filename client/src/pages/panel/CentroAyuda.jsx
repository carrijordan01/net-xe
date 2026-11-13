import { Link } from "react-router-dom";
import { BookOpen, FileSignature, HelpCircle, Scale, ShieldCheck, Workflow } from "lucide-react";
import { obtenerUsuario } from "../../auth/sesion";
import { tarjeta } from "../../components/contratos/SeccionesContrato";
import { ESTADOS } from "../../components/contratos/estados";
import useTitulo from "../../utils/useTitulo";

const pasos = {
  SOLICITANTE: [
    ["Crea el contrato", <>En <Link to="/panel/crear" className="text-blue-700 hover:underline">Crear contrato</Link> elige una plantilla, la contraparte y completa los datos. Revisa el resumen antes de enviarlo.</>],
    ["Espera la respuesta", "La contraparte revisa el contrato y lo acepta o rechaza. Mientras nadie firme, puedes editarlo o eliminarlo."],
    ["Firma", "Cuando la contraparte lo acepte, firma con tu contraseña y tu PIN. El contrato queda firmado cuando ambas partes firman."],
    ["Gestiona", "Consulta tus contratos por estado, revisa su historial y, si un contrato firmado necesita cambios, solicita su edición o eliminación."]
  ],
  CONTRAPARTE: [
    ["Revisa lo que recibes", <>Los contratos que te ofrecen aparecen en <Link to="/panel/contratos/pendientes" className="text-blue-700 hover:underline">Pendientes</Link> y en la campana de notificaciones.</>],
    ["Acepta o rechaza", "Lee todos los datos. Si estás de acuerdo, acéptalo; si no, recházalo indicando el motivo."],
    ["Firma", "Una vez aceptado, firma con tu contraseña y tu PIN. El contrato queda firmado cuando ambas partes firman."],
    ["Responde solicitudes", "Si el solicitante pide editar o eliminar un contrato firmado, verás los cambios propuestos y podrás aprobarlos o rechazarlos."]
  ]
};

const descripcionEstados = {
  PENDIENTE: "La contraparte aún no lo acepta ni lo rechaza. El solicitante puede editarlo o eliminarlo.",
  ACEPTADO: "La contraparte lo aceptó y falta la firma de una o ambas partes.",
  FIRMADO: "Ambas partes lo firmaron. Para modificarlo o eliminarlo se necesita una solicitud aprobada.",
  RECHAZADO: "La contraparte no lo aceptó. Ya no se puede firmar.",
  ELIMINADO: "Se eliminó y se conserva solo para consulta."
};

const preguntas = [
  ["¿Qué hago si olvidé mi contraseña?", "En la página de inicio de sesión, usa «¿Olvidaste tu contraseña?». Te enviaremos a tu correo un enlace que vence en 30 minutos y sirve una sola vez. Al cambiarla, se cierran las sesiones abiertas en todos tus dispositivos."],
  ["¿Qué pasa si olvido mi PIN de firma?", "Puedes cambiarlo en Configurar cuenta usando tu contraseña y el PIN actual. Si no lo recuerdas, esta versión de Net-Xe aún no permite recuperarlo por correo."],
  ["¿Por qué se bloqueó mi firma?", "Después de 5 intentos fallidos de contraseña o PIN, la firma se bloquea durante 15 minutos para proteger tu cuenta. Tu sesión sigue activa y puedes usar el resto de la plataforma."],
  ["¿Puedo modificar un contrato que ya firmé?", "Sí, pero no directamente: el solicitante envía una solicitud con la versión propuesta y la contraparte debe aprobarla. Si se aprueba, ambas partes vuelven a firmar."],
  ["¿Qué significa «El contenido coincide con lo firmado»?", "Al firmar se guarda una huella SHA-256 del contenido del contrato. Si el contenido actual produce la misma huella, no ha cambiado desde la firma."],
  ["¿Cómo envío un correo a la otra parte?", "Desde su perfil, con «Enviar correo». Se abrirá tu programa de correo; Net-Xe no envía correos por ti."],
  ["¿Qué hace bloquear a un usuario?", "Impide que se ofrezcan contratos entre ustedes y oculta tus datos de contacto. Los contratos que ya tienen en común no cambian. Puedes desbloquearlo en Usuarios bloqueados."],
  ["¿Puedo cambiar mi correo?", "No. El correo es tu identificador para iniciar sesión. Puedes actualizar tu nombre, teléfono y empresa en Configurar cuenta."]
];

const secciones = [
  ["primeros-pasos", "Primeros pasos", Workflow],
  ["estados", "Estados de un contrato", BookOpen],
  ["firma", "La firma electrónica", FileSignature],
  ["seguridad", "Seguridad de tu cuenta", ShieldCheck],
  ["preguntas", "Preguntas frecuentes", HelpCircle],
  ["legal", "Información legal", Scale]
];

function Titulo({ id, children }) {
  const seccion = secciones.find(([s]) => s === id);
  const Icono = seccion[2];
  return (
    <h2 id={id} className="scroll-mt-24 flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
      <Icono size={20} className="text-blue-700" /> {children}
    </h2>
  );
}

export default function CentroAyuda() {
  useTitulo("Centro de ayuda");
  const usuario = obtenerUsuario();
  const otroRol = usuario.role === "SOLICITANTE" ? "CONTRAPARTE" : "SOLICITANTE";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Centro de ayuda e información</h1>
        <p className="text-gray-600 mt-1">Todo lo que necesitas para crear, revisar y firmar contratos en Net-Xe.</p>
      </div>

      <nav aria-label="Secciones de ayuda" className="flex flex-wrap gap-2">
        {secciones.map(([id, texto]) => (
          <a key={id} href={`#${id}`} className="px-3 py-1.5 rounded-full text-sm border border-gray-300 bg-white text-gray-700 hover:border-blue-400">
            {texto}
          </a>
        ))}
      </nav>

      <section className={tarjeta}>
        <Titulo id="primeros-pasos">Primeros pasos</Titulo>
        {[usuario.role, otroRol].map((rol) => (
          <div key={rol} className={rol === usuario.role ? "" : "mt-6 pt-6 border-t border-gray-100"}>
            <h3 className="font-semibold text-gray-800 mb-3">
              {rol === "SOLICITANTE" ? "Si eres Solicitante" : "Si eres Contraparte"}
              {rol === usuario.role && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Tu rol</span>}
            </h3>
            <ol className="space-y-3">
              {pasos[rol].map(([titulo, texto], i) => (
                <li key={titulo} className="flex gap-3">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-green-500 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm text-gray-700"><b className="text-gray-800">{titulo}.</b> {texto}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <section className={tarjeta}>
        <Titulo id="estados">Estados de un contrato</Titulo>
        <dl className="space-y-3">
          {Object.entries(ESTADOS).map(([clave, e]) => (
            <div key={clave} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <dt className="sm:w-48 shrink-0"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${e.clase}`}>{e.texto}</span></dt>
              <dd className="text-sm text-gray-700">{descripcionEstados[clave]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={tarjeta}>
        <Titulo id="firma">La firma electrónica</Titulo>
        <div className="space-y-3 text-sm text-gray-700">
          <p>Net-Xe usa una <b>firma electrónica simple con trazabilidad</b>. Para firmar debes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>marcar la casilla en la que declaras haber leído y aceptado el contrato;</li>
            <li>ingresar la contraseña de tu cuenta;</li>
            <li>ingresar tu PIN de firma de 6 dígitos (lo creas en tu primera firma).</li>
          </ul>
          <p>
            Cada firma registra la fecha y hora, la dirección IP y una <b>huella SHA-256</b> del contenido firmado. Con esa huella
            se puede comprobar después que el contrato no ha cambiado. Todas las acciones quedan en el historial del contrato.
          </p>
        </div>
      </section>

      <section className={tarjeta}>
        <Titulo id="seguridad">Seguridad de tu cuenta</Titulo>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li>No compartas tu contraseña ni tu PIN: con ellos se puede firmar en tu nombre.</li>
          <li>Tras 5 intentos fallidos de firma, la firma se bloquea 15 minutos.</li>
          <li>La sesión dura 24 horas; después deberás iniciar sesión nuevamente.</li>
          <li>Puedes cambiar tu contraseña y tu PIN en <Link to="/panel/configuracion" className="text-blue-700 hover:underline">Configurar cuenta</Link>.</li>
        </ul>
      </section>

      <section className={tarjeta}>
        <Titulo id="preguntas">Preguntas frecuentes</Titulo>
        <div className="divide-y divide-gray-100">
          {preguntas.map(([pregunta, respuesta]) => (
            <details key={pregunta} className="group py-3">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-medium text-gray-800">
                {pregunta}
                <span className="text-blue-700 transition-transform group-open:rotate-45 text-xl leading-none" aria-hidden="true">+</span>
              </summary>
              <p className="mt-2 text-sm text-gray-700">{respuesta}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={tarjeta}>
        <Titulo id="legal">Información legal</Titulo>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            En Chile, la <b>Ley N° 19.799</b> sobre documentos electrónicos y firma electrónica reconoce la validez de los
            documentos y firmas electrónicas, siempre que se cumplan los requisitos de autenticidad, integridad y consentimiento
            de las partes.
          </p>
          <p>
            La firma de Net-Xe es una firma electrónica <b>simple</b>. No equivale a la firma electrónica avanzada emitida por un
            prestador de servicios de certificación acreditado, y no reemplaza los actos que la ley exige realizar en forma
            presencial o por escritura pública, como la compraventa de bienes raíces. Las plantillas que tienen estas
            limitaciones lo advierten.
          </p>
          <p>
            Tus datos personales se usan solo para operar la plataforma, conforme a la normativa chilena de protección de datos
            personales.
          </p>
          <p className="text-gray-500">
            Esta información es orientativa y no constituye asesoría legal. Para acuerdos complejos o de alto valor, consulta con un
            abogado.
          </p>
        </div>
      </section>
    </div>
  );
}
