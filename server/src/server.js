import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import contractRoutes from "./routes/contracts.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/contracts", contractRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});