import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerContrato, editarContrato } from "../services/contratos";

export default function EditarContrato() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "",
    descripcion: "",
    clausulas: "",
    documentos: []
  });

  const [bloqueado, setBloqueado] = useState(false);
  const [loading, setLoading] = useState(true);

  // CARGAR CONTRATO
  useEffect(() => {
    const cargarContrato = async () => {
      try {
        const contrato = await obtenerContrato(id);

        if (contrato.firmadoContraparte && contrato.firmadoSolicitante) {
          setBloqueado(true);
        }

        setFormData({
          titulo: contrato.titulo,
          tipo: contrato.tipo,
          descripcion: contrato.descripcion,
          clausulas: contrato.clausulas,
          documentos: contrato.documentos || []
        });

        setLoading(false);
      } catch (err) {
        console.error("Error al cargar contrato:", err);

        const mensaje =
          err?.response?.data?.message ||
          err?.message ||
          "No se pudo cargar el contrato.";

        alert(mensaje);
        navigate("/dashboard");
      }
    };

    cargarContrato();
  }, [id, navigate]);

  //CAMBIAR FORMULARIO
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //GUARDAR CAMBIOS
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (bloqueado) return;

    try {
      await editarContrato(id, formData);

      alert("Contrato actualizado correctamente");
      navigate("/mis-contratos");
    } catch (err) {
      console.error("Error al actualizar contrato:", err);

      const mensaje =
        err?.response?.data?.message ||
        err?.message ||
        "Error inesperado al actualizar el contrato.";

      alert(mensaje);
    }
  };

  if (loading) return <p>Cargando...</p>;

  //VISTA
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar contrato</h1>

      {bloqueado && (
        <p className="bg-red-500 text-white p-3 rounded mb-4">
          Este contrato ya está firmado por ambas partes y no puede ser editado.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label>Título</label>
          <input
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            className="border p-2 w-full"
            disabled={bloqueado}
            required
          />
        </div>

        <div>
          <label>Tipo de contrato</label>
          <input
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="border p-2 w-full"
            disabled={bloqueado}
            required
          />
        </div>

        <div>
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className="border p-2 w-full"
            disabled={bloqueado}
            required
          />
        </div>

        <div>
          <label>Cláusulas</label>
          <textarea
            name="clausulas"
            value={formData.clausulas}
            onChange={handleChange}
            className="border p-2 w-full h-40"
            disabled={bloqueado}
            required
          />
        </div>

        {!bloqueado && (
          <button
            type="submit"
            className="bg-blue-600 px-4 py-2 text-white rounded"
          >
            Guardar cambios
          </button>
        )}
      </form>
    </div>
  );
}
