export const cosineSimilarity = (
  a: number[],
  b: number[],
  normA?: number,
  normB?: number
): number => {

  let dot = 0;
  let magA = normA || 0;
  let magB = normB || 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];

    if (!normA) magA += a[i] * a[i];
    if (!normB) magB += b[i] * b[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  return dot / (magA * magB);
};