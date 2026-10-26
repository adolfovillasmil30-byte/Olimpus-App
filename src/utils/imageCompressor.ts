/**
 * Client-side image compression utility using HTML5 Canvas.
 * Ensures images do not exceed 800px on either dimension,
 * compresses with quality 0.7 (JPEG/WebP), and guarantees
 * a file size strictly under 150 KB to preserve free-tier storage quotas.
 */

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
  sizeKb: number;
  width: number;
  height: number;
  mimeType: string;
}

const MAX_DIMENSION = 800;
const INITIAL_QUALITY = 0.7;
const MAX_ALLOWED_BYTES = 150 * 1024; // 150 KB limit

/**
 * Compresses an image file or blob using an offscreen HTML5 canvas.
 * - Caps max width/height to 800px while maintaining aspect ratio.
 * - Compresses with initial quality 0.7.
 * - If size exceeds 150 KB, progressively tunes down quality/dimension until under 150 KB.
 */
export async function compressFoodImage(
  fileOrBlob: File | Blob,
  preferredMimeType: 'image/jpeg' | 'image/webp' = 'image/jpeg'
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // Read source file as Data URL
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo de imagen'));
    };

    reader.onload = (event) => {
      const srcUrl = event.target?.result as string;
      if (!srcUrl) {
        reject(new Error('Contenido de imagen vacío'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('No se pudo decodificar la imagen seleccionada'));
      };

      img.onload = async () => {
        try {
          // Calculate target dimensions capped at 800px
          let targetWidth = img.naturalWidth || img.width;
          let targetHeight = img.naturalHeight || img.height;

          if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
            if (targetWidth >= targetHeight) {
              targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
              targetWidth = MAX_DIMENSION;
            } else {
              targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
              targetHeight = MAX_DIMENSION;
            }
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo inicializar el contexto de Canvas'));
            return;
          }

          // Fill background white for transparent PNGs converted to JPEG
          if (preferredMimeType === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }

          // High quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Progressive compression loop to guarantee < 150 KB
          let quality = INITIAL_QUALITY;
          let currentBlob: Blob | null = null;
          let attempts = 0;

          // Helper to get blob from canvas
          const getBlobPromise = (q: number): Promise<Blob | null> => {
            return new Promise((res) => {
              canvas.toBlob(
                (blob) => res(blob),
                preferredMimeType,
                q
              );
            });
          };

          // Try initial quality 0.7
          currentBlob = await getBlobPromise(quality);

          // If blob is still > 150 KB, decrease quality progressively
          while (currentBlob && currentBlob.size > MAX_ALLOWED_BYTES && attempts < 5) {
            attempts++;
            quality = Math.max(0.2, quality - 0.12);
            currentBlob = await getBlobPromise(quality);
          }

          // If still over 150 KB after quality reductions, scale canvas down slightly
          if (currentBlob && currentBlob.size > MAX_ALLOWED_BYTES) {
            const smallerCanvas = document.createElement('canvas');
            const scaledWidth = Math.round(targetWidth * 0.75);
            const scaledHeight = Math.round(targetHeight * 0.75);
            smallerCanvas.width = scaledWidth;
            smallerCanvas.height = scaledHeight;
            const sCtx = smallerCanvas.getContext('2d');
            if (sCtx) {
              if (preferredMimeType === 'image/jpeg') {
                sCtx.fillStyle = '#FFFFFF';
                sCtx.fillRect(0, 0, scaledWidth, scaledHeight);
              }
              sCtx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
              const fallbackBlob = await new Promise<Blob | null>((res) => {
                smallerCanvas.toBlob((b) => res(b), preferredMimeType, 0.6);
              });
              if (fallbackBlob) {
                currentBlob = fallbackBlob;
                targetWidth = scaledWidth;
                targetHeight = scaledHeight;
              }
            }
          }

          if (!currentBlob) {
            reject(new Error('Fallo al comprimir la imagen en Canvas'));
            return;
          }

          // Generate preview dataUrl from the compressed blob
          const previewReader = new FileReader();
          previewReader.onloadend = () => {
            const finalDataUrl = previewReader.result as string;
            const sizeBytes = currentBlob!.size;
            const sizeKb = Math.round((sizeBytes / 1024) * 10) / 10;

            resolve({
              blob: currentBlob!,
              dataUrl: finalDataUrl,
              sizeBytes,
              sizeKb,
              width: targetWidth,
              height: targetHeight,
              mimeType: preferredMimeType,
            });
          };
          previewReader.readAsDataURL(currentBlob);
        } catch (err) {
          reject(err);
        }
      };

      img.src = srcUrl;
    };

    reader.readAsDataURL(fileOrBlob);
  });
}
