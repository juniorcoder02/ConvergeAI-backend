import "dotenv/config.js";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ProjectModel from "./models/project.model.js";
import { generateResult } from "./services/ai.service.js";

const port = process.env.PORT;

function formatAIResponseToMarkdown(data) {
  let md = `**${data.text}**\n\n`;

  if (data.fileTree) {
    for (const [filename, { content, language }] of Object.entries(
      data.fileTree
    )) {
      md += `### 📄 \`${filename}\`\n`;
      md += `\`\`\`${language || ""}\n${content.trim()}\n\`\`\`\n\n`;
    }
  }

  if (data.buildCommand) {
    md += `### 🔧 Build Command\n\`${
      data.buildCommand.mainItem
    } ${data.buildCommand.commands?.join(" ")}\`\n\n`;
  }

  if (data.startCommand) {
    md += `### 🚀 Start Command\n\`${
      data.startCommand.mainItem
    } ${data.startCommand.commands?.join(" ")}\`\n\n`;
  }

  return `**AI**:\n\n${md}`;
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://convergeai-7ss3.onrender.com",
    credentials:true,
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid project Id"));
    }
    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return next(new Error("Project not found"));
    }

    socket.project = project;

    if (!token) {
      return next(new Error("Authorization Error"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new Error("Authentication Error"));
    }

    socket.user = decoded;

    next();
  } catch (err) {
    next(err);
  }
});
io.on("connection", (socket) => {
  try {
    if (!socket.project) {
      console.warn("No project assigned to socket, skipping...");
      return;
    }
    socket.roomId = socket.project._id.toString();
    console.log("New client connected", socket.id);

    socket.join(socket.roomId);

    socket.on("project-message", async (data) => {
      const message = data.message;
      const isAI = message.startsWith("/ai");

      if (isAI) {
        const prompt = message.replace("/ai", "").trim();
        try {

          const result = await generateResult(prompt);

          const parsed = JSON.parse(result); 

          io.to(socket.roomId).emit("project-message", {
            message: `**AI**: ${parsed.text}`,
            sender: { _id: "ai", email: "AI" },
          });
          if (parsed.fileTree) {
            io.to(socket.roomId).emit("project-filetree", {
              fileTree: parsed.fileTree,
            });
          }
        } catch (error) {
          console.error("Error from Gemini:", error);
          io.to(socket.roomId).emit("project-message", {
            message: `**AI**: Error generating response.`,
            sender: {
              _id: "ai",
              email: "AI",
            },
          });
        }
        return;
      }

      // For normal user messages
      socket.broadcast.to(socket.roomId).emit("project-message", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
      socket.leave(socket.roomId);
    });
  } catch (err) {
    console.error("Error in socket connection:", err);
  }
});

server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
