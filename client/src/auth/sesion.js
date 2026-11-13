// Manejo de la sesión guardada en el navegador (token JWT + datos del usuario)

function leerPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function guardarSesion(token, usuario) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(usuario));
}

export function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Devuelve el usuario si hay una sesión vigente; si el token expiró, la limpia
export function obtenerUsuario() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = leerPayload(token);
  if (!payload || (payload.exp && payload.exp * 1000 <= Date.now())) {
    cerrarSesion();
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

export const nombreRol = (rol) => (rol === "CONTRAPARTE" ? "Contraparte" : "Solicitante");

// Reemplaza los datos del usuario guardados (p. ej. tras editar el perfil) y
// avisa a la interfaz para que se vuelva a dibujar
export const EVENTO_SESION = "netxe:sesion-actualizada";

export function actualizarUsuarioSesion(usuario) {
  localStorage.setItem("user", JSON.stringify(usuario));
  window.dispatchEvent(new Event(EVENTO_SESION));
}
