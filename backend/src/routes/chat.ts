import { Router } from "express";
import { CohereClient } from "cohere-ai";
import { generateEmbedding } from "../rag/embedding";
import { getVectors } from "../rag/vectorStore";
import { cosineSimilarity } from "../rag/similarity";

const router = Router();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || ""
});

router.post("/", async (req, res) => {

  try {

    const sessionId = req.headers.sessionid as string;

    // ⭐ READ RAW VALUES (NO DEFAULT FALLBACK HERE)
    const question: string = req.body.question;
    const topK: number = Number(req.body.topK);
    const threshold: number = Number(req.body.threshold);

    console.log("Retrieval settings:", { topK, threshold });

    const vectors = getVectors(sessionId);

    console.log("Vector count:", vectors.length);

    if (!vectors.length) {
      return res.json({
        answer: "No documents uploaded",
        retrieved: []
      });
    }

    const queryEmbedding = await generateEmbedding(
      question,
      "search_query"
    );

    const scored = vectors.map(v => ({
      text: v.text,
      score: cosineSimilarity(queryEmbedding, v.embedding)
    }));

    // ⭐ ALWAYS SORT FIRST
    const sorted = scored.sort((a,b)=>b.score-a.score);

    // ⭐ ALWAYS TAKE TOPK FIRST
    const retrieved = sorted.slice(0, topK);

    console.log("Retrieved count:", retrieved.length);

    const context = retrieved.map(r => r.text).join("\n");

    const response = await cohere.chat({
      model: "command-a-03-2025",
      message: `
Use ONLY this context to answer:

${context}

Question:
${question}
`
    });

    res.json({
      answer: response.text,
      retrieved
    });

  } catch (err) {

    console.error("Chat error:", err);

    res.status(500).json({
      answer: "Internal error occurred",
      retrieved: []
    });
  }
});

export default router;