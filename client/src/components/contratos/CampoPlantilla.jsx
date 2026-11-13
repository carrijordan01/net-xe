// Un campo del formulario de contrato, según su definición en el catálogo
const claseBase =
  "w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none";

export default function CampoPlantilla({ campo, valor, error, onChange }) {
  const id = `campo-${campo.nombre}`;
  const clase = `${claseBase} ${error ? "border-red-400" : "border-gray-300"}`;
  const descripcion = [campo.ayuda && `${id}-ayuda`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const comunes = {
    id,
    name: campo.nombre,
    "aria-invalid": Boolean(error),
    "aria-describedby": descripcion
  };
  const cambiar = (e) => onChange(campo.nombre, e.target.value);

  let control;
  switch (campo.tipo) {
    case "textoLargo":
      control = <textarea {...comunes} rows={3} value={valor ?? ""} onChange={cambiar} className={clase} />;
      break;
    case "numero":
      control = (
        <input {...comunes} type="number" inputMode="numeric" min={campo.min} max={campo.max} step="1"
          value={valor ?? ""} onChange={cambiar} className={clase} />
      );
      break;
    case "moneda":
      control = (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input {...comunes} type="number" inputMode="numeric" min="0" step="1"
            value={valor ?? ""} onChange={cambiar} className={`${clase} pl-7`} placeholder="0" />
        </div>
      );
      break;
    case "porcentaje":
      control = (
        <div className="relative">
          <input {...comunes} type="number" inputMode="decimal" min="0" max="100" step="0.01"
            value={valor ?? ""} onChange={cambiar} className={`${clase} pr-8`} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
        </div>
      );
      break;
    case "fecha":
      control = <input {...comunes} type="date" value={valor ?? ""} onChange={cambiar} className={clase} />;
      break;
    case "seleccion":
      control = (
        <select {...comunes} value={valor ?? ""} onChange={cambiar} className={clase}>
          <option value="">Selecciona una opción</option>
          {campo.opciones.map((o) => {
            const [v, texto] = typeof o === "string" ? [o, o] : [o.valor, o.texto];
            return <option key={v} value={v}>{texto}</option>;
          })}
        </select>
      );
      break;
    case "siNo":
      return (
        <div>
          <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input {...comunes} type="checkbox" checked={valor === true}
              onChange={(e) => onChange(campo.nombre, e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
            {campo.etiqueta}
          </label>
          {campo.ayuda && <p id={`${id}-ayuda`} className="mt-1 text-xs text-gray-500">{campo.ayuda}</p>}
        </div>
      );
    default:
      control = <input {...comunes} type="text" value={valor ?? ""} onChange={cambiar} className={clase} />;
  }

  return (
    <div className={campo.tipo === "textoLargo" ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {campo.etiqueta}
        {campo.requerido ? <span className="text-red-600"> *</span> : <span className="text-gray-400 font-normal"> (opcional)</span>}
      </label>
      {control}
      {campo.ayuda && <p id={`${id}-ayuda`} className="mt-1 text-xs text-gray-500">{campo.ayuda}</p>}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
