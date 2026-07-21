export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

export type CropOutputFormat = "image/png" | "image/jpeg"

/**
 * Prefer PNG so transparency is kept (JPEG fills transparent pixels with black).
 * Use JPEG only for opaque photo sources when explicitly requested.
 */
export function preferredCropOutput(imageSrc: string): {
  mime: CropOutputFormat
  filename: string
} {
  const src = imageSrc.toLowerCase()
  const isJpeg =
    src.startsWith("data:image/jpeg") ||
    src.startsWith("data:image/jpg") ||
    /\.jpe?g($|\?)/i.test(src)
  if (isJpeg) {
    return { mime: "image/jpeg", filename: "edited-image.jpg" }
  }
  return { mime: "image/png", filename: "edited-image.png" }
}

/**
 * This function was adapted from the one in the react-easy-crop introduction example.
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  outputMime?: CropOutputFormat
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return null
  }

  const mime = outputMime ?? preferredCropOutput(imageSrc).mime
  const rotRad = getRadianAngle(rotation)

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // JPEG has no alpha — fill white so transparent sources don't become black.
  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  ctx.drawImage(image, 0, 0)

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  )

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  if (mime === "image/jpeg") {
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.putImageData(data, 0, 0)

  return new Promise((resolve) => {
    canvas.toBlob(
      (file) => {
        resolve(file)
      },
      mime,
      mime === "image/jpeg" ? 0.92 : undefined
    )
  })
}
