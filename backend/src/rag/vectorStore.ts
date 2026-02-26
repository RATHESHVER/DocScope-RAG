export interface ChunkVector {
  text: string;
  embedding: number[];
}

const store: Record<string, ChunkVector[]> = {};

export const saveVectors = (
  sessionId: string,
  data: ChunkVector[]
): void => {

  if (!store[sessionId]) {
    store[sessionId] = [];
  }

  store[sessionId].push(...data);
};

export const getVectors = (
  sessionId: string
): ChunkVector[] => {
  return store[sessionId] || [];
};

export const clearSession = (
  sessionId: string
): void => {
  delete store[sessionId];
};