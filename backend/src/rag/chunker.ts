
export const chunkText = (
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] => {
  const chunks: string[] = [];

  let start = 0;

  while (start < text.length) {
    const chunk = text.slice(start, start + chunkSize);
    chunks.push(chunk);

    start += chunkSize - overlap;
  }

  return chunks;
};