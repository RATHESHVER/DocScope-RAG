import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";

import { generateEmbedding } from "../rag/embedding";
import { saveVectors } from "../rag/vectorStore";

const router = Router();
const upload = multer();

router.post("/", upload.single("file"), async (req, res) => {

  try {

    const sessionId = req.headers.sessionid as string;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } else {
      text = req.file.buffer.toString();
    }

    // ⭐ CLEAN TEXT
    text = text.replace(/\r\n/g, "\n").trim();

    // ⭐ REAL CHUNKING LOGIC (THIS WAS MISSING)
    const CHUNK_SIZE = 500;
    const OVERLAP = 50;

    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += (CHUNK_SIZE - OVERLAP)) {
      const slice = text.slice(i, i + CHUNK_SIZE);
      if (slice.trim().length > 20) {
        chunks.push(slice);
      }
    }

    // ⭐ GENERATE EMBEDDINGS
    const vectors = [];

    for (const chunk of chunks) {

      const embedding = await generateEmbedding(
        chunk,
        "search_document"
      );

      vectors.push({
        text: chunk,
        embedding
      });
    }

    saveVectors(sessionId, vectors);

    res.json({
      message: "File processed successfully",
      chunkCount: vectors.length
    });

  } catch (err) {

    console.error("Upload error:", err);

    res.status(500).json({
      error: "Upload failed"
    });
  }
});

export default router;