export function fotoDefault(): Uint8Array<ArrayBuffer> {
  return Buffer.from("/productodefecto.jpg", "base64");
}

// transformar un File | null a Buffer
export async function fileToBuffer(file: File | null): Promise<Buffer | null> {
  if (!file || file.size === 0) return null;
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
