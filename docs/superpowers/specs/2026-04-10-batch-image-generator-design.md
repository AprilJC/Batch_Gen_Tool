# Batch Image Generator — Design Spec

**Date:** 2026-04-10

## Overview

A web tool for batch image editing. Users upload a folder of images (up to 10), enter a text prompt and their Google API key, then the tool sends each image to the Gemini API for transformation. Results are displayed live, can be individually regenerated, and downloaded one-by-one or as a ZIP.

---

## Tech Stack

- **Frontend:** Vite + React (single-page app)
- **Backend:** Node.js + Express (proxy for Gemini API calls)
- **Root:** `concurrently` runs both client and server in dev
- **Batch download:** JSZip (client-side, no server involvement)

---

## Project Structure

```
batch-image-tool/
  client/
    src/
      App.jsx          # root state, generation orchestration
      ConfigPanel.jsx  # API key input, prompt textarea, Generate All + Download All buttons
      ImageGrid.jsx    # responsive CSS grid of ImageCard components
      ImageCard.jsx    # per-image card: input preview, status, output preview, actions
      api.js           # fetch wrapper for POST /api/generate
    index.html
    vite.config.js
  server/
    index.js           # Express server, POST /api/generate endpoint
  package.json         # root: concurrently script
```

---

## Architecture

### Data Flow

```
Browser
  → reads folder via <input webkitdirectory>
  → base64-encodes each image client-side
  → POST /api/generate (one at a time, sequentially)

Express /api/generate
  → receives { image, mimeType, prompt } + x-api-key header
  → calls Gemini API: gemini-3.1-flash-image-preview
  → returns { image, mimeType } or { error }

Browser
  → updates card state live
  → displays output image on success
```

### Key Decisions

- **Images stay in memory** — no disk storage on server; images passed as base64 in request/response bodies
- **Sequential generation** — images processed one at a time to respect Gemini rate limits; errors skip to next image without stopping the batch
- **API key in request header** (`x-api-key`) — never stored server-side, sent per-request from browser
- **10 image hard limit** — enforced at upload time in the frontend; excess files are ignored with a user-visible notice
- **Batch download via JSZip** — ZIP assembled client-side from completed output images; only `status: "done"` images are included

---

## API

### `POST /api/generate`

**Request headers:**
```
x-api-key: <user's Gemini API key>
Content-Type: application/json
```

**Request body:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "mimeType": "image/jpeg",
  "prompt": "Transform into a watercolor painting style"
}
```

**Response (success):**
```json
{
  "image": "data:image/png;base64,...",
  "mimeType": "image/png"
}
```

**Response (error):**
```json
{
  "error": "Invalid API key"
}
```

---

## Frontend State

Each image in the `images` array has this shape:

```js
{
  id: "uuid",
  filename: "photo_001.jpg",
  inputDataUrl: "data:image/jpeg;base64,...",
  mimeType: "image/jpeg",
  status: "idle" | "generating" | "done" | "error",
  outputDataUrl: "data:image/png;base64,..." | null,
  error: "string" | null
}
```

Global state in `App.jsx`:
- `apiKey` — string
- `prompt` — string
- `images` — array of image objects above
- `isGenerating` — boolean (locks UI during batch run)

---

## Components

### `ConfigPanel`
- Password-type input for API key
- Textarea for prompt
- "Generate All" button — disabled if no API key, no prompt, no images, or `isGenerating`
- "Download All" button — disabled if no images with `status: "done"`

### `ImageGrid`
- Responsive CSS grid (auto-fill, min 200px columns)
- Renders one `ImageCard` per image

### `ImageCard`
- Filename label (truncated)
- Two-column layout: input image (left) | output slot (right)
- Output slot states:
  - `idle` — empty dashed placeholder
  - `generating` — spinner animation, blue border on card
  - `done` — output image, green border on card
  - `error` — error message text, red border on card
- "Regenerate" button — calls `/api/generate` for this image only; disabled while `isGenerating` is true or while this card's status is `generating`
- "Download" button — enabled only when `status: "done"`; downloads `output_<filename>.png`

### Upload Zone
- `<input type="file" webkitdirectory>` styled as drag-drop area
- Shows `{n}/10 images loaded`; silently truncates at 10
- Accepted types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

---

## Generation Loop

```
async function generateAll():
  set isGenerating = true
  for each image where status !== "done":
    set image.status = "generating"
    try:
      result = await POST /api/generate
      set image.outputDataUrl = result.image
      set image.status = "done"
    catch:
      set image.error = error message
      set image.status = "error"
      // continues to next image
  set isGenerating = false
```

---

## Batch Download

- Triggered by "Download All" button
- Uses JSZip client-side
- Iterates `images` where `status === "done"`
- Strips the `data:image/...;base64,` prefix, adds raw base64 to zip
- Filename in zip: `output_<original_filename_without_ext>.png`
- Triggers browser download as `batch_output.zip`

---

## Error Handling

- **Invalid API key** — Gemini returns 4xx; server forwards error message; card shows error state
- **Rate limit** — Gemini returns 429; card shows "Rate limited, try regenerating"
- **File too large** — client-side check before upload; images over 10MB are rejected with a visible warning
- **Unsupported format** — filtered at upload time by MIME type check

---

## Out of Scope

- User accounts or saved sessions
- Server-side file storage
- Prompt history
- Custom per-image prompts (one global prompt for all)
- Progress percentage within a single generation call
