// Envío de correos con nodemailer.
//   · Con SMTP_HOST definido en .env: envío real por ese servidor SMTP.
//   · Sin SMTP: modo local. El correo se guarda como .eml en server/correos/
//     (excluida de git) y se muestra un aviso en la consola del servidor.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

// CARPETA_CORREOS en el entorno la cambia (las pruebas usan una carpeta temporal)
export const CARPETA_CORREOS = process.env.CARPETA_CORREOS || fileURLToPath(new URL("../correos", import.meta.url));

const modoSmtp = Boolean(process.env.SMTP_HOST);
const remitente = process.env.CORREO_REMITENTE || "Net-Xe <no-responder@net-xe.local>";

const transporte = modoSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    })
  : nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "windows" });

export const modoCorreo = modoSmtp ? "smtp" : "local";

// Envía un correo { para, asunto, texto, html }. Devuelve la ruta del .eml en modo local.
export async function enviarCorreo({ para, asunto, texto, html }) {
  const info = await transporte.sendMail({ from: remitente, to: para, subject: asunto, text: texto, html });
  if (modoSmtp) return null;

  await fs.mkdir(CARPETA_CORREOS, { recursive: true });
  const marca = new Date().toISOString().replace(/[:.]/g, "-");
  const destinatario = para.replace(/[^a-z0-9@._-]/gi, "_");
  const archivo = path.join(CARPETA_CORREOS, `${marca}_${destinatario}.eml`);
  await fs.writeFile(archivo, info.message);
  console.log(`[correo local] «${asunto}» para ${para} guardado en ${archivo}`);
  return archivo;
}

// Plantilla HTML simple con los colores de Net-Xe
export function plantillaCorreo({ titulo, parrafos, boton, pie }) {
  const escapar = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f0fdf4;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:520px;margin:24px auto;background:#ffffff;border:2px solid #4ade80;border-radius:16px;padding:28px">
    <p style="margin:0 0 16px;font-size:22px;font-weight:bold;color:#1e3a8a">Net-Xe</p>
    <h1 style="font-size:18px;color:#1e3a8a;margin:0 0 16px">${escapar(titulo)}</h1>
    ${parrafos.map((p) => `<p style="font-size:14px;line-height:1.5;margin:0 0 12px">${escapar(p)}</p>`).join("\n    ")}
    ${boton ? `<p style="margin:24px 0"><a href="${escapar(boton.url)}" style="background:#22c55e;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;display:inline-block">${escapar(boton.texto)}</a></p>
    <p style="font-size:12px;color:#6b7280;word-break:break-all">Si el botón no funciona, copia este enlace en tu navegador:<br>${escapar(boton.url)}</p>` : ""}
    ${pie ? `<p style="font-size:12px;color:#6b7280;margin-top:24px">${escapar(pie)}</p>` : ""}
  </div>
</body></html>`;
}
