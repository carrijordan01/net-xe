import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [extraFields, setExtraFields] = useState({});
  const navigate = useNavigate();

  const renderExtraFields = () => {
    switch (type) {
      case "INDEFINIDO":
      case "PLAZO_FIJO":
      case "OBRA_FAENA":
      case "JORNADA_PARCIAL":
      case "REEMPLAZO":
      case "APRENDIZAJE":
      case "HONORARIOS":
        return (
        <>
        <input
        type="text"
        placeholder="Cargo o función"
        value={extraFields.position || ""}
        onChange={(e) =>
        setExtraFields({ ...extraFields, position: e.target.value })
        }
        className="border p-2 rounded w-full"

        />
        <input
        type="number"
        placeholder="Sueldo o remuneración ($)"
        value={extraFields.salary || ""}
        onChange={(e) =>
        setExtraFields({ ...extraFields, salary: e.target.value })
        }
        className="border p-2 rounded w-full"
        />
        </>
        );
        case "COMPRAVENTA_BIENES":
        case "COMPRAVENTA_DOMINIO":
        case "COMPRAVENTA_INTERNACIONAL":
          return (
          <>
          <input
          type="text"
          placeholder="Bien o servicio vendido"
          value={extraFields.item || ""}
          onChange={(e) =>
          setExtraFields({ ...extraFields, item: e.target.value })
          }
          className="border p-2 rounded w-full"

          />
          <input
          type="number"
          placeholder="Precio total ($)"
          value={extraFields.price || ""}
          onChange={(e) =>
          setExtraFields({ ...extraFields, price: e.target.value })
          }
          className="border p-2 rounded w-full"

          />

          </>
          );
          case "SERVICIOS_PROFESIONALES":
          case "MANDATO":
          case "ARRENDAMIENTO_SERVICIOS":
            return (
            <>
            <input
            type="text"
            placeholder="Tipo de servicio"
            value={extraFields.serviceType || ""}
            onChange={(e) =>
            setExtraFields({ ...extraFields, serviceType: e.target.value })
            }
            className="border p-2 rounded w-full"

            />
            <input
            type="number"
            placeholder="Monto acordado ($)"
            value={extraFields.amount || ""}
            onChange={(e) =>
            setExtraFields({ ...extraFields, amount: e.target.value })
            }
            className="border p-2 rounded w-full"

            />
            </>
            );
            default:
              return null;
            }
          };

  //Verificar token y cargar contratos contracts.map
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token desde localStorage:", token);

    if (!token) {
      alert("Token no encontrado. Inicia sesión nuevamente.");
      navigate("/login");
      return;
    }

    const fetchContracts = async () => {
      try {
        const token = localStorage.getItem("token")
          console.log("Token encontrado:", token)

        const res = await axios.get("http://localhost:4000/contracts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setContracts(res.data);
      } catch (err) {
        console.error("Error al obtener contratos:", err);
        alert("Error al obtener contratos: " + (err.response?.data?.error || "desconocido"));
        if (err.response?.status === 401) navigate("/login");
      }
    };

    fetchContracts();
  }, [navigate]);

  //Crear contrato nuevo
  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        "http://localhost:4000/contracts",
        {
          title,
          description,
          status: "Pendiente",
          type,
          extraFields,
          content: "Contenido del contrato de prueba",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTitle("");
      setDescription("");
      setType("");

      // Refrescar la lista
      const res = await axios.get("http://localhost:4000/contracts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContracts(res.data);
    } catch (err) {
      console.error("Error al crear contrato:", err);
      alert("Error al crear contrato: " + (err.response?.data?.error || "desconocido"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-1/6 bg-blue-950 text-white flex flex-col items-center py-6">
        <div className="bg-green-500 rounded-full w-10 h-10 mb-4"></div>
        <p className="text-sm font-semibold">Notificaciones</p>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Contratos</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Formulario de creación */}
        <form
          onSubmit={handleCreate}
          className="bg-white border border-green-400 rounded-lg p-4 mb-8 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Crear nuevo contrato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Título del contrato"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border p-2 rounded w-full"
              required
            >
              <option value="">Seleccione el tipo de contrato</option>
              <optgroup label="Contratos de empleabilidad/laborales">
                <option value="INDEFINIDO">Contrato indefinido</option>
                <option value="PLAZO_FIJO">Contrato a plazo fijo</option>
                <option value="OBRA_FAENA">Contrato por obra o faena</option>
                <option value="JORNADA_PARCIAL">Contrato de jornada parcial</option>
                <option value="REEMPLAZO">Contrato de reemplazo</option>
                <option value="APRENDIZAJE">Contrato de aprendizaje</option>
                <option value="HONORARIOS">Contrato a honorarios</option>
              </optgroup>
              <optgroup label="Contratos de prestación de servicios">
                <option value="SERVICIOS_PROFESIONALES">Servicios profesionales</option>
                <option value="MANDATO">Mandato</option>
                <option value="ARRENDAMIENTO_SERVICIOS">Arrendamiento de servicios</option>
              </optgroup>
              <optgroup label="Contratos de compraventa">
                <option value="COMPRAVENTA_BIENES">Compraventa de bienes</option>
                <option value="COMPRAVENTA_DOMINIO">Compraventa con reserva de dominio</option>
                <option value="COMPRAVENTA_INTERNACIONAL">Compraventa internacional</option>
              </optgroup>
              <optgroup label="Contratos mercantiles y comerciales">
                <option value="SOCIEDAD">Sociedad</option>
                <option value="SUMINISTRO">Suministro</option>
                <option value="FRANQUICIA">Franquicia</option>
                <option value="LEASING">Leasing</option>
                <option value="FACTORING">Factoring</option>
                <option value="DISTRIBUCION">Distribución</option>
                <option value="AGENCIA">Agencia</option>
              </optgroup>
              <optgroup label="Contratos civiles patrimoniales">
                <option value="ARRIENDO">Arriendo</option>
                <option value="COMODATO">Comodato</option>
                <option value="DONACION">Donación</option>
                <option value="MUTUO">Mutuo</option>
                <option value="HIPOTECA">Hipoteca o prenda</option>
              </optgroup>
              <optgroup label="Contratos de ejecución">
                <option value="EJECUCION_INMEDIATA">Ejecución inmediata</option>
                <option value="TRACTO_SUCESIVO">Tracto sucesivo</option>
              </optgroup>
            </select>
            {renderExtraFields()}
          </div>

          <textarea
            placeholder="Descripción del contrato"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded w-full mt-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          ></textarea>

          <button
            type="submit"
            className="w-full bg-green-500 text-white mt-4 py-2 rounded hover:bg-green-600"
          >
            Crear Contrato
          </button>
        </form>

        {/* Listado de contratos */}
        <div className="space-y-4">
        {contracts.length > 0 ? (
          <>
          {contracts.map((c) => (
            <div
            key={c.id}
            className="bg-white shadow border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
            >
            <div>
              <h3 className="font-semibold text-gray-800">{c.title}</h3>
              <p className="text-gray-500 text-sm">{c.description}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
              c.status === "Pendiente"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"}`}
            >
            {c.status}
            </span>
            </div>
            ))}
            
            <ul className="mt-4 space-y-2">
            {contracts.map((c) => (
              <li key={c.id} className="p-3 bg-white shadow rounded">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-gray-600">{c.type}</p>
                <p className="text-xs text-gray-500 italic">{c.status}</p>
              </li>
              ))}
            </ul>
          </>
        ) : (  
      <p>No hay contratos disponibles.</p>
      )}
      </div>
      </main>
    </div>
  );
}

export default Contracts;
