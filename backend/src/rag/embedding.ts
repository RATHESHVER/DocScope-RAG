import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || ""
});

export const generateEmbedding = async (
  text: string,
  type: "search_document" | "search_query" = "search_document"
): Promise<number[]> => {

  const response = await cohere.embed({
    model: "embed-english-v3.0",
    texts: [text],
    inputType: type   // ✅ correct for your SDK
  });

  return (response.embeddings as number[][])[0];
};