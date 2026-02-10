import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieparser from "cookie-parser";
import cors from "cors";
import { connect } from "mongoose";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js"
import messageRoutes from "./routes/message.routes.js"
import {app,server,io} from "./lib/socket.js"


const PORT=process.env.PORT ||8080;




app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(cookieparser());


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);


// Routes
app.use("/api/auth",authRoutes);
app.use("/api/messages",messageRoutes)


server.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`);
    connectDB();
})