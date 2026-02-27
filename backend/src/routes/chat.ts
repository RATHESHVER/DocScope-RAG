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

    if (!sessionId) {
      return res.status(400).json({
        answer: "Session ID missing",
        retrieved: []
      });
    }

    const question: string = req.body.question;
    const topK: number = Number(req.body.topK) || 3;
    const threshold: number = Number(req.body.threshold) || 0.3;

    if (!question || question.trim() === "") {
      return res.status(400).json({
        answer: "Question is required",
        retrieved: []
      });
    }

    const vectors = getVectors(sessionId);

    if (!vectors || vectors.length === 0) {
      return res.json({
        answer: "This question is outside the scope of uploaded documents",
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

    // ✅ Apply threshold FIRST
    const filtered = scored
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (filtered.length === 0) {
      return res.json({
        answer: "This question is outside the scope of uploaded documents",
        retrieved: []
      });
    }

    const context = filtered.map(r => r.text).join("\n");

    const response = await cohere.chat({
      model: "command-a-03-2025",
      message: `
Use ONLY the provided context to answer the question.
If the answer is not contained in the context, respond:
"This question is outside the scope of uploaded documents"

Context:
${context}

Question:
${question}
`
    });

    res.json({
      answer: response.text,
      retrieved: filtered
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