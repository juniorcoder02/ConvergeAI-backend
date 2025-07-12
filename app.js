import express from "express";
import morgan from "morgan";
import connectDB from "./db/db.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import cookieParser from "cookie-parser";
import aiRoutes from "./routes/ai.routes.js";
import projectInviteRoutes from "./routes/projectInvite.routes.js"
import cors from "cors";

connectDB();

const app = express();

app.use(cors({
  origin:'http://localhost:5173',
  credentials:true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/user", userRoutes);
app.use('/api/project', projectRoutes);
app.use("/api/project-invite", projectInviteRoutes);
app.use("/api/ai",aiRoutes);

export default app;
