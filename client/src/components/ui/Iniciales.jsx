// Círculo con las iniciales del usuario
export default function Iniciales({ usuario, tamano = "w-11 h-11", color = "bg-blue-900" }) {
  const texto = `${usuario.firstName?.[0] ?? ""}${usuario.lastName?.[0] ?? ""}`.toUpperCase();
  return (
    <span className={`${tamano} ${color} shrink-0 rounded-full text-white flex items-center justify-center font-bold`} aria-hidden="true">
      {texto || "?"}
    </span>
  );
}
