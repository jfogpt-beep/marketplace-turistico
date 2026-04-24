/**
 * Cloudflare R2 — Helpers para almacenamiento de imágenes
 */

export interface UploadResult {
  key: string;
  publicUrl: string;
  thumbnailUrl: string;
}

/**
 * Genera presigned URL para subida directa a R2
 */
export async function getPresignedUploadUrl(
  r2: R2Bucket,
  key: string,
  contentType: string,
  expirySeconds: number = 300
): Promise<string> {
  return r2.createSignedUrl(key, {
    method: "PUT",
    expirySeconds,
    customMetadata: { "content-type": contentType },
  });
}

/**
 * Construye URL pública de R2 con Cloudflare Images variant
 */
export function getPublicImageUrl(
  bucketName: string,
  key: string,
  variant: "thumbnail" | "card" | "full" | "gallery" = "full"
): string {
  const base = `https://${bucketName}.r2.dev/${key}`;
  // Si usas Cloudflare Images con R2 como source:
  // return `https://imagedelivery.net/<account-hash>/${key}/${variant}`;
  return base;
}

/**
 * Borra una imagen de R2
 */
export async function deleteImage(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key);
}

/**
 * Valida tipo y tamaño de archivo
 */
export function validateImageUpload(
  contentType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowedTypes.includes(contentType)) {
    return { valid: false, error: "Tipo de archivo no permitido. Usa JPG, PNG, WebP o AVIF." };
  }
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (sizeBytes > maxSize) {
    return { valid: false, error: `Archivo demasiado grande. Máximo 10MB.` };
  }
  return { valid: true };
}
