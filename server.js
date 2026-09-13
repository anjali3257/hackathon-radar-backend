import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import scanRoutes from "./routes/scanRoutes.js";
import analyzeRoutes from "./routes/analyzeRoutes.js";
import actionRoutes from "./routes/actionRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection failed:", err.message));

app.get("/", (req, res) => {
  res.json({ message: "Hackathon Radar backend is running" });
});

app.use("/api/scan", scanRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/action", actionRoutes);
app.use("/api/profile", profileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});