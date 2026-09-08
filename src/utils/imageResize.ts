const MAX_FULL_WIDTH = 1280;
const MAX_THUMB_WIDTH = 400;
const FULL_QUALITY = 0.7;
const THUMB_QUALITY = 0.6;

export interface ProcessedImage {
  full: File;
  thumbnail: File;
}

export async function processImageForUpload(file: File): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file);
  const full = await resizeToBlob(bitmap, MAX_FULL_WIDTH, FULL_QUALITY, 'image/jpeg');
  const thumbnail = await resizeToBlob(bitmap, MAX_THUMB_WIDTH, THUMB_QUALITY, 'image/jpeg');

  const baseName = file.name.replace(/\.[^.]+$/, '');
  const fullFile = new File([full], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  const thumbFile = new File([thumbnail], `${baseName}-thumb.jpg`, { type: 'image/jpeg', lastModified: Date.now() });

  return { full: fullFile, thumbnail: thumbFile };
}

async function resizeToBlob(
  bitmap: ImageBitmap,
  maxWidth: number,
  quality: number,
  type: string
): Promise<Blob> {
  const scale = Math.min(1, maxWidth / bitmap.width);
  const targetWidth = Math.round(bitmap.width * scale);
  const targetHeight = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      type,
      quality
    );
  });
  return blob;
}
