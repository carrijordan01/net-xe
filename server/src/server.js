import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import contractRoutes from "./routes/contracts.js";
import contratosRoutes from "./routes/contratos.js";
import usersRoutes from "./routes/users.js";
import notificacionesRouter from "./routes/notificaciones.js";
import historialRoutes from "./routes/historial.routes.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/contracts", contractRoutes);
app.use("/contratos", contratosRoutes);
app.use("/users", usersRoutes);
app.use("/notificaciones", notificacionesRouter);
app.use("/api/historial", historialRoutes);
app.use("/api/contratos", contratosRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});