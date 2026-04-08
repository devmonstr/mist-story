"use client"

import Image from "next/image"
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { Image as ImageIcon, X, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import {
  Card,
  CardContent,
  CardDescription as CardDescriptionText,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type NovelCoverImageSelection = {
  dataUrl: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
}

type PendingCoverImageEdit = {
  sourceDataUrl: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
  sourceWidth: number
  sourceHeight: number
}

type CoverImageEditorOffset = {
  x: number
  y: number
}

type CoverImageEditorDragState = {
  pointerId: number
  originX: number
  originY: number
  startOffset: CoverImageEditorOffset
}

type NovelCoverImageFieldProps = {
  coverImage: string | null
  coverImageName: string | null
  error: string | null
  onErrorChange: (value: string | null) => void
  onChange: (value: NovelCoverImageSelection | null) => void
}

const MAX_COVER_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_COVER_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const COVER_IMAGE_EDITOR_MAX_ZOOM = 3.5
const COVER_IMAGE_VIEWPORT_WIDTH = 240
const COVER_IMAGE_VIEWPORT_HEIGHT = 360
const COVER_IMAGE_OUTPUT_WIDTH = 1200
const COVER_IMAGE_OUTPUT_HEIGHT = 1800

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getCoverImageEditorMetrics(
  image: PendingCoverImageEdit,
  zoom: number
) {
  const baseScale = Math.max(
    COVER_IMAGE_VIEWPORT_WIDTH / image.sourceWidth,
    COVER_IMAGE_VIEWPORT_HEIGHT / image.sourceHeight,
  )
  const scale = baseScale * zoom
  const scaledWidth = image.sourceWidth * scale
  const scaledHeight = image.sourceHeight * scale

  return {
    scale,
    scaledWidth,
    scaledHeight,
    minOffsetX: Math.min(0, COVER_IMAGE_VIEWPORT_WIDTH - scaledWidth),
    maxOffsetX: 0,
    minOffsetY: Math.min(0, COVER_IMAGE_VIEWPORT_HEIGHT - scaledHeight),
    maxOffsetY: 0,
  }
}

function getCenteredCoverImageOffset(
  image: PendingCoverImageEdit,
  zoom: number
): CoverImageEditorOffset {
  const { scaledWidth, scaledHeight } = getCoverImageEditorMetrics(image, zoom)

  return {
    x: (COVER_IMAGE_VIEWPORT_WIDTH - scaledWidth) / 2,
    y: (COVER_IMAGE_VIEWPORT_HEIGHT - scaledHeight) / 2,
  }
}

function clampCoverImageEditorOffset(
  image: PendingCoverImageEdit,
  zoom: number,
  offset: CoverImageEditorOffset
): CoverImageEditorOffset {
  const { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY } = getCoverImageEditorMetrics(
    image,
    zoom
  )

  return {
    x: clampNumber(offset.x, minOffsetX, maxOffsetX),
    y: clampNumber(offset.y, minOffsetY, maxOffsetY),
  }
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Failed to read image data"))
    reader.readAsDataURL(blob)
  })
}

function readFileAsDataUrl(file: File) {
  return readBlobAsDataUrl(file)
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load the selected image"))
    image.src = dataUrl
  })
}

async function renderCroppedCoverImage(
  image: PendingCoverImageEdit,
  zoom: number,
  offset: CoverImageEditorOffset
): Promise<NovelCoverImageSelection> {
  const { scale } = getCoverImageEditorMetrics(image, zoom)
  const sourceX = clampNumber(-offset.x / scale, 0, image.sourceWidth)
  const sourceY = clampNumber(-offset.y / scale, 0, image.sourceHeight)
  const sourceWidth = clampNumber(
    COVER_IMAGE_VIEWPORT_WIDTH / scale,
    1,
    image.sourceWidth - sourceX
  )
  const sourceHeight = clampNumber(
    COVER_IMAGE_VIEWPORT_HEIGHT / scale,
    1,
    image.sourceHeight - sourceY
  )

  const canvas = document.createElement("canvas")
  canvas.width = COVER_IMAGE_OUTPUT_WIDTH
  canvas.height = COVER_IMAGE_OUTPUT_HEIGHT

  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Image editor is not available in this browser")
  }

  const sourceImage = await loadImageFromDataUrl(image.sourceDataUrl)
  context.drawImage(
    sourceImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    COVER_IMAGE_OUTPUT_WIDTH,
    COVER_IMAGE_OUTPUT_HEIGHT,
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error("Failed to render the cropped image"))
          return
        }

        resolve(nextBlob)
      },
      image.mimeType,
      image.mimeType === "image/png" ? undefined : 0.92,
    )
  })

  return {
    dataUrl: await readBlobAsDataUrl(blob),
    fileName: image.fileName,
    mimeType: blob.type || image.mimeType,
    fileSizeBytes: blob.size,
  }
}

export function NovelCoverImageField({
  coverImage,
  coverImageName,
  error,
  onErrorChange,
  onChange,
}: NovelCoverImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragStateRef = useRef<CoverImageEditorDragState | null>(null)
  const [pendingCoverImageEdit, setPendingCoverImageEdit] =
    useState<PendingCoverImageEdit | null>(null)
  const [coverImageEditorZoom, setCoverImageEditorZoom] = useState(1)
  const [coverImageEditorOffset, setCoverImageEditorOffset] = useState<CoverImageEditorOffset>({
    x: 0,
    y: 0,
  })
  const [isDraggingCoverImageEditor, setIsDraggingCoverImageEditor] = useState(false)
  const [isApplyingCoverImageEdit, setIsApplyingCoverImageEdit] = useState(false)

  useEffect(() => {
    if (!pendingCoverImageEdit) {
      setCoverImageEditorZoom(1)
      setCoverImageEditorOffset({ x: 0, y: 0 })
      setIsDraggingCoverImageEditor(false)
      dragStateRef.current = null
      return
    }

    setCoverImageEditorZoom(1)
    setCoverImageEditorOffset(getCenteredCoverImageOffset(pendingCoverImageEdit, 1))
    setIsDraggingCoverImageEditor(false)
    dragStateRef.current = null
  }, [pendingCoverImageEdit])

  const handleCoverImageSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    if (!ALLOWED_COVER_MIME_TYPES.has(file.type)) {
      onErrorChange("Please choose a JPG, PNG, or WEBP image.")
      return
    }

    if (file.size > MAX_COVER_FILE_SIZE_BYTES) {
      onErrorChange("Cover image must be 5MB or smaller.")
      return
    }

    void (async () => {
      try {
        const sourceDataUrl = await readFileAsDataUrl(file)
        const sourceImage = await loadImageFromDataUrl(sourceDataUrl)
        setPendingCoverImageEdit({
          sourceDataUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          sourceWidth: sourceImage.naturalWidth || sourceImage.width,
          sourceHeight: sourceImage.naturalHeight || sourceImage.height,
        })
        onErrorChange(null)
      } catch (nextError) {
        const message =
          nextError instanceof Error
            ? nextError.message
            : "Failed to prepare the selected image"
        onErrorChange(message)
      }
    })()
  }

  const handleRemoveCoverImage = () => {
    onChange(null)
    onErrorChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (open || isApplyingCoverImageEdit) {
      return
    }

    setPendingCoverImageEdit(null)
  }

  const handleZoomChange = (value: number[]) => {
    const nextZoom = value[0] ?? 1
    if (!pendingCoverImageEdit) {
      return
    }

    const currentMetrics = getCoverImageEditorMetrics(
      pendingCoverImageEdit,
      coverImageEditorZoom
    )
    const nextMetrics = getCoverImageEditorMetrics(pendingCoverImageEdit, nextZoom)
    const focusX =
      (COVER_IMAGE_VIEWPORT_WIDTH / 2 - coverImageEditorOffset.x) / currentMetrics.scale
    const focusY =
      (COVER_IMAGE_VIEWPORT_HEIGHT / 2 - coverImageEditorOffset.y) / currentMetrics.scale
    const nextOffset = clampCoverImageEditorOffset(pendingCoverImageEdit, nextZoom, {
      x: COVER_IMAGE_VIEWPORT_WIDTH / 2 - focusX * nextMetrics.scale,
      y: COVER_IMAGE_VIEWPORT_HEIGHT / 2 - focusY * nextMetrics.scale,
    })

    setCoverImageEditorZoom(nextZoom)
    setCoverImageEditorOffset(nextOffset)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pendingCoverImageEdit) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startOffset: coverImageEditorOffset,
    }
    setIsDraggingCoverImageEditor(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!pendingCoverImageEdit || !dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    const nextOffset = clampCoverImageEditorOffset(
      pendingCoverImageEdit,
      coverImageEditorZoom,
      {
        x: dragState.startOffset.x + (event.clientX - dragState.originX),
        y: dragState.startOffset.y + (event.clientY - dragState.originY),
      }
    )

    setCoverImageEditorOffset(nextOffset)
  }

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    dragStateRef.current = null
    setIsDraggingCoverImageEditor(false)
  }

  const handleApplyCoverImageEdit = async () => {
    if (!pendingCoverImageEdit) {
      return
    }

    setIsApplyingCoverImageEdit(true)

    try {
      const nextImage = await renderCroppedCoverImage(
        pendingCoverImageEdit,
        coverImageEditorZoom,
        coverImageEditorOffset
      )
      onChange(nextImage)
      onErrorChange(null)
      setPendingCoverImageEdit(null)
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Failed to crop the selected image"
      onErrorChange(message)
    } finally {
      setIsApplyingCoverImageEdit(false)
    }
  }

  const activeMetrics = pendingCoverImageEdit
    ? getCoverImageEditorMetrics(pendingCoverImageEdit, coverImageEditorZoom)
    : null

  return (
    <>
      <Dialog
        open={pendingCoverImageEdit !== null}
        onOpenChange={handleDialogOpenChange}
      >
        {pendingCoverImageEdit && activeMetrics ? (
          <DialogContent
            className="w-full max-w-[min(36rem,calc(100%-1.5rem))] gap-5 rounded-none p-0 sm:max-w-2xl"
            showCloseButton={false}
          >
            <DialogHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-4 text-left">
              <div>
                <DialogTitle>Edit cover image</DialogTitle>
                <DialogDescription className="mt-1">
                  Drag to reposition your cover, then zoom in for a tighter portrait crop.
                </DialogDescription>
              </div>
              <Button
                type="button"
                className="rounded-none px-5"
                onClick={() => void handleApplyCoverImageEdit()}
                disabled={isApplyingCoverImageEdit}
              >
                {isApplyingCoverImageEdit ? "Applying..." : "Apply"}
              </Button>
            </DialogHeader>

            <div className="space-y-4 px-5 pb-5">
              <div className="border border-border bg-background p-4">
                <div
                  className={cn(
                    "relative mx-auto overflow-hidden border-2 border-foreground bg-black touch-none select-none",
                    isDraggingCoverImageEditor ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{
                    width: `${COVER_IMAGE_VIEWPORT_WIDTH}px`,
                    height: `${COVER_IMAGE_VIEWPORT_HEIGHT}px`,
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={finishDrag}
                  onPointerCancel={finishDrag}
                >
                  <Image
                    src={pendingCoverImageEdit.sourceDataUrl}
                    alt="Selected cover image"
                    unoptimized
                    width={Math.round(activeMetrics.scaledWidth)}
                    height={Math.round(activeMetrics.scaledHeight)}
                    className="pointer-events-none absolute left-0 top-0 max-w-none"
                    style={{
                      width: `${activeMetrics.scaledWidth}px`,
                      height: `${activeMetrics.scaledHeight}px`,
                      transform: `translate(${coverImageEditorOffset.x}px, ${coverImageEditorOffset.y}px)`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 border border-border bg-background px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Recommended ratio: 2:3 portrait. We keep the cropped result as the cover upload.
                </p>
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[coverImageEditorZoom]}
                    min={1}
                    max={COVER_IMAGE_EDITOR_MAX_ZOOM}
                    step={0.01}
                    onValueChange={handleZoomChange}
                    aria-label="Zoom selected cover image"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t px-5 py-4 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingCoverImageEdit(null)}
                disabled={isApplyingCoverImageEdit}
              >
                Cancel
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, and WEBP are supported. Maximum file size is 5MB.
              </p>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <Card className="rounded-none border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Cover Image</CardTitle>
          <CardDescriptionText>Upload and frame the cover shown to readers.</CardDescriptionText>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {coverImage ? (
              <div className="relative">
                <Image
                  src={coverImage}
                  alt="Cover preview"
                  width={144}
                  height={208}
                  className="h-52 w-36 border border-border object-cover shadow-none"
                />
                <button
                  type="button"
                  onClick={handleRemoveCoverImage}
                  className="absolute -right-2 -top-2 border border-destructive bg-background p-1 text-destructive transition-colors hover:bg-destructive/10"
                  aria-label="Remove cover image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-52 w-36 shrink-0 flex-col items-center justify-center border-2 border-dashed border-border bg-background px-4 text-center transition-colors hover:border-foreground hover:bg-muted/20"
              >
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span className="mt-3 text-sm font-medium text-foreground">
                  Click to upload
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  600x900px recommended
                </span>
              </button>
            )}

            <div className="flex-1 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCoverImageSelection}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-none"
              >
                {coverImage ? "Replace image" : "Upload cover"}
              </Button>
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Recommended ratio: 2:3 portrait</p>
                <p>Supported formats: JPG, PNG, WEBP</p>
                <p>Maximum file size: 5MB</p>
                <p>Uploads go to Cloudflare R2 and the asset metadata is saved with the novel.</p>
                {coverImageName ? (
                  <p className="text-foreground/80">Selected: {coverImageName}</p>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
