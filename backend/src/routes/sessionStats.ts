import express from "express";
import { getVectors, clearSession } from "../rag/vectorStore";

const router = express.Router();

router.get("/", (req, res) => {
  const sessionId = req.headers["sessionid"] as string;

  const vectors = getVectors(sessionId) || [];

  res.json({
    documents: vectors.length > 0 ? 1 : 0,
    chunks: vectors.length
  });
});

router.delete("/", (req, res) => {
  const sessionId = req.headers["sessionid"] as string;

  clearSession(sessionId);

  res.json({ message: "Session cleared" });
});

export default router;