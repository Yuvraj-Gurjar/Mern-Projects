import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieparser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { app, server } from "./lib/socket.js";

const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieparser());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? "http://localhost:5173"
        : true,
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();

  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
  connectDB();
});
