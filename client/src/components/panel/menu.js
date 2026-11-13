import {
  LayoutDashboard, FilePlus2, FileCheck2, Clock, Trash2, XCircle, Files,
  UserRound, Settings, Ban, LifeBuoy, Users
} from "lucide-react";

// Secciones de la barra lateral según el rol del usuario
export function menuPorRol(rol) {
  const esSolicitante = rol === "SOLICITANTE";

  const gestion = esSolicitante
    ? [
        { to: "/panel", texto: "Inicio", Icono: LayoutDashboard, exacto: true },
        { to: "/panel/crear", texto: "Crear contrato", Icono: FilePlus2 },
        { to: "/panel/contratos/pendientes", texto: "Pendientes", Icono: Clock },
        { to: "/panel/contratos/firmados", texto: "Firmados", Icono: FileCheck2 },
        { to: "/panel/contratos/eliminados", texto: "Eliminados", Icono: Trash2 },
        { to: "/panel/contratos", texto: "Todos mis contratos", Icono: Files, exacto: true }
      ]
    : [
        { to: "/panel", texto: "Inicio", Icono: LayoutDashboard, exacto: true },
        { to: "/panel/contratos/pendientes", texto: "Pendientes", Icono: Clock },
        { to: "/panel/contratos/firmados", texto: "Firmados", Icono: FileCheck2 },
        { to: "/panel/contratos/rechazados", texto: "Rechazados", Icono: XCircle },
        { to: "/panel/contratos", texto: "Contratos recibidos", Icono: Files, exacto: true }
      ];

  return [
    { titulo: "Gestión de contratos", items: gestion },
    { titulo: "Usuarios", items: [{ to: "/panel/usuarios", texto: "Buscar usuarios", Icono: Users }] },
    {
      titulo: "Opciones de usuario",
      items: [
        { to: "/panel/perfil", texto: "Ver perfil", Icono: UserRound },
        { to: "/panel/configuracion", texto: "Configurar cuenta", Icono: Settings },
        { to: "/panel/bloqueados", texto: "Usuarios bloqueados", Icono: Ban }
      ]
    },
    {
      titulo: "Centro de ayuda",
      items: [{ to: "/panel/ayuda", texto: "Ayuda e información", Icono: LifeBuoy }]
    }
  ];
}

// Listados por estado según el rol (ruta → estados del servidor).
// "Pendientes" incluye los aceptados que aún esperan las firmas.
const PENDIENTES = ["PENDIENTE", "ACEPTADO"];
const FIRMADOS = ["FIRMADO"];
export const estadosPorRol = {
  SOLICITANTE: { pendientes: PENDIENTES, firmados: FIRMADOS, eliminados: ["ELIMINADO"] },
  CONTRAPARTE: { pendientes: PENDIENTES, firmados: FIRMADOS, rechazados: ["RECHAZADO"] }
};
