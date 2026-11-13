import express from "express";
import requireAuth from "../middleware/auth.js";
import {
  CAMPOS_COMUNES, CATEGORIAS, MODALIDADES, NIVELES, listarPlantillas, obtenerPlantilla
} from "../catalogo/plantillas.js";

const router = express.Router();

// Catálogo completo (resumen de cada plantilla)
router.get("/", requireAuth, (req, res) => {
  res.json({
    categorias: CATEGORIAS,
    niveles: NIVELES,
    modalidades: MODALIDADES,
    plantillas: listarPlantillas().map(({ campos, ...resumen }) => ({
      ...resumen,
      cantidadCampos: campos.length,
      camposRequeridos: campos.filter((c) => c.requerido).length,
      etiquetasCampos: campos.map((c) => c.etiqueta)
    }))
  });
});

// Definición completa de una plantilla, con los campos comunes
router.get("/:tipo", requireAuth, (req, res) => {
  const plantilla = obtenerPlantilla(req.params.tipo.toUpperCase());
  if (!plantilla) return res.status(404).json({ error: "Plantilla no encontrada." });

  res.json({ ...plantilla, camposComunes: CAMPOS_COMUNES, modalidades: MODALIDADES });
});

export default router;
