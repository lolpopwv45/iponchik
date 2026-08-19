const MAX_EDGE = 1280
const QUALITY = 0.78
const SKIP_IF_SMALLER_THAN = 180_000

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

export async function compressProductImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file)
    try {
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      const alreadySmall =
        scale === 1 &&
        file.size <= SKIP_IF_SMALLER_THAN &&
        (file.type === 'image/webp' || file.type === 'image/jpeg')

      if (alreadySmall) return file

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) return file
      context.drawImage(bitmap, 0, 0, width, height)

      const webp = await canvasToBlob(canvas, 'image/webp', QUALITY)
      const blob =
        webp && webp.size > 0 ? webp : await canvasToBlob(canvas, 'image/jpeg', QUALITY)
      if (!blob || blob.size === 0 || blob.size >= file.size) return file

      const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
      const name = file.name.replace(/\.[^.]+$/, '') + `.${extension}`
      return new File([blob], name, { type: blob.type, lastModified: Date.now() })
    } finally {
      bitmap.close()
    }
  } catch {
    return file
  }
}
