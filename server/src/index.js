import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import contractsRoutes from './routes/contracts.js';

const app = express();

app.use(cors({
    origin: true,
    credentials: true
  }));

/*app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));*/

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/contracts", contractsRoutes);

app.listen(4000, () => console.log("Servidor corriendo en http://localhost:4000"));
