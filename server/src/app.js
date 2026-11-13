// Aplicación Express sin iniciar el servidor: la usan index.js y las pruebas (Supertest)
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import contratosRoutes from './routes/contratos.js';
import usuariosRoutes from './routes/user.js';
import notificacionesRoutes from './routes/notificaciones.js';
import plantillasRoutes from './routes/plantillas.js';
import solicitudesRoutes from './routes/solicitudes.js';
import documentosRoutes from './routes/documentos.js';
import recuperacionRoutes from './routes/recuperacion.js';

const app = express();

app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
  // Permite que el cliente lea el nombre de archivo de las descargas
  exposedHeaders: ["Content-Disposition"]
}));

app.use(express.json());

app.use("/api/auth/recuperacion", recuperacionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contratos/:id/solicitudes", solicitudesRoutes);
app.use("/api/contratos/:id/documentos", documentosRoutes);
app.use("/api/contratos", contratosRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/plantillas", plantillasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({ error: "Error del servidor" });
});

export default app;
