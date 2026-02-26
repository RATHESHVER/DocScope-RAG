import dotenv from "dotenv";
dotenv.config();
import sessionStatsRoute from "./routes/sessionStats";
import chatRoute from "./routes/chat";
import uploadRoute from "./routes/upload";
import sessionRoute from "./routes/session";

import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/session", sessionRoute);
app.use("/upload", uploadRoute);
app.use("/chat", chatRoute);
app.use("/session-stats", sessionStatsRoute);

app.get("/", (req, res) => {
  res.send("RAG Backend Running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});