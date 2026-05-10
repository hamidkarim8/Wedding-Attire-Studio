# Wedding Attire Studio — Project Specification

## Overview
A standalone Next.js web application that allows users to virtually try on wedding attire using the FASHN AI API. The app is designed as a POC (proof of concept) to be eventually integrated into a larger system. The UI must be minimalistic, clean, mobile-responsive, and professional. No emoji anywhere in the UI.

---

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Hosting**: Google Cloud VM with Nginx (production), localhost (development)
- **Image Storage**: `/public/uploads/` (served statically by Next.js / Nginx)
- **Collection Metadata**: `/data/collection.json` (flat JSON file, server-side)

---

## Environment Variables
Create a `.env.local` file:
```
FASHN_API_KEY=your_api_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
- `FASHN_API_KEY` — used server-side only, never exposed to client
- `NEXT_PUBLIC_BASE_URL` — used to construct public image URLs for the FASHN API (e.g. `https://yourdomain.com`)

---

## Folder Structure
```
/app
  /api
    /upload/route.ts         # Handles image uploads, saves to /public/uploads/
    /generate/route.ts       # Handles FASHN API calls (tryon + edit)
    /collection/route.ts     # GET and POST to collection.json
  /page.tsx                  # Main page (Studio tab)
  /layout.tsx
  /globals.css
/components
  /ImageUploader.tsx         # Reusable image upload + preview component
  /ColorPicker.tsx           # Color picker with presets
  /LoadingState.tsx          # Step-by-step loading indicator
  /ResultCard.tsx            # Generated image card with download button
  /CollectionGrid.tsx        # Grid of past generations
/public
  /uploads/                  # All uploaded + generated images stored here
/data
  /collection.json           # Persisted collection metadata
/lib
  /fashn.ts                  # FASHN API helper functions
  /prompt.ts                 # Dynamic prompt builder
  /collection.ts             # Collection read/write helpers
```

---

## UI Layout

### Navigation Tabs
Two tabs at the top of the page:
1. **Studio** — main generation form
2. **Collection** — all generated results

### Studio Tab Layout (top to bottom)
1. Page title: `Wedding Attire Studio`
2. Subtitle: `AI-powered virtual wedding attire fitting`
3. Form section
4. Generate button
5. Loading state (shown during generation)
6. Result section (shown after completion)

---

## Form Fields

### 1. Model Image (Required)
- Label: `Model Photo`
- Upload component with drag-and-drop and click-to-upload
- Preview uploaded image
- Helper text (shown below the upload area):
  ```
  Upload a photo with 1 or 2 faces only.
  - 1 face: solo fitting for groom or bride
  - 2 faces: couple fitting (groom and bride together)
  Use a clear, well-lit photo with the subject(s) facing forward.
  Avoid sunglasses, hats, or obstructions on the face.
  A neutral background gives the best result.
  ```
- After upload, show a radio/toggle: `Number of people in photo` → `1 Person` / `2 People`

### 2. Attire Image (Required)
- Label: `Wedding Attire`
- Upload component with drag-and-drop and click-to-upload
- Preview uploaded image
- Helper text:
  ```
  Upload the wedding attire you want to try on.
  For best results, use an attire photo without a model wearing it.
  A plain or white background works best.
  ```

### 3. Posing Style (Required)
- Label: `Posing Style`
- Two selectable cards (not a plain dropdown):
  - `Sitting` — description: "Groom and bride seated side by side"
  - `Standing` — description: "Groom and bride standing side by side"
- Default: `Sitting`

### 4. Background Scenery (Optional)
- Label: `Background Scenery`
- Upload component (optional)
- Helper text:
  ```
  Upload a background image for the scene.
  If left empty, a white-themed Malaysian wedding 'pelamin kahwin' will be used.
  ```
- Show a clear `Optional` badge next to the label

### 5. Attire Color (Optional)
- Label: `Attire Color`
- Show preset color swatches first:
  - White `#FFFFFF`
  - Ivory `#FFFFF0`
  - Champagne `#F7E7CE`
  - Gold `#CFB53B`
  - Blush Pink `#FFB6C1`
  - Dusty Rose `#DCAE96`
  - Maroon `#800000`
  - Burgundy `#800020`
  - Navy `#001F5B`
  - Sage Green `#BCB88A`
  - Black `#000000`
- Below presets, a free color picker input (native `<input type="color">`)
- Show a `Clear` option to remove color selection
- Show `Optional` badge next to the label

### Form Actions
- `Generate` button (primary, full width on mobile) — disabled if model image or attire image is missing
- `Reset` button (secondary, full width on mobile) — clears all inputs and previews

---

## Generation Flow

### Step 1 — Upload Images
On Generate click:
1. Upload model image → POST `/api/upload` → returns `{ url: "https://domain.com/uploads/filename.jpg" }`
2. Upload attire image → POST `/api/upload` → returns `{ url: "..." }`
3. If background image provided → upload it too → returns `{ url: "..." }`

### Step 2 — Virtual Try-On (FASHN tryon-max)
POST to `https://api.fashn.ai/v1/run`:
```json
{
  "model_name": "tryon-max",
  "inputs": {
    "model_image": "<uploaded model image URL>",
    "product_image": "<uploaded attire image URL>",
    "prompt": "<dynamically built — see Prompt Builder section>",
    "resolution": "1k"
  }
}
```
Poll `GET https://api.fashn.ai/v1/status/{id}` every 3 seconds until `completed` or `failed`.

### Step 3 — Background Edit (FASHN edit) — Only if background image was uploaded
POST to `https://api.fashn.ai/v1/run`:
```json
{
  "model_name": "edit",
  "inputs": {
    "image": "<output URL from Step 2>",
    "prompt": "Follow exactly the background scenery as shown in the image context. Do not alter the people, attire, or faces. Only replace the background.",
    "image_context": "<uploaded background image URL>",
    "resolution": "1k"
  }
}
```
Poll until `completed` or `failed`.

### Step 4 — Save to Collection
After final result is ready, POST to `/api/collection` with:
```json
{
  "id": "uuid",
  "timestamp": "ISO string",
  "resultUrl": "final output URL",
  "modelImageUrl": "...",
  "attireImageUrl": "...",
  "backgroundImageUrl": "..." or null,
  "poseStyle": "sitting" or "standing",
  "color": "#RRGGBB" or null,
  "peopleCount": 1 or 2
}
```

### Step 5 — Show Result
Display the final image with:
- Full-width image display
- `Download` button
- `Generate Another` button (resets the form)

---

## Loading States
Show a clear step-by-step loading indicator during generation. Each step has a label and a spinner or checkmark:

```
[ ] Uploading images...
[ ] Generating virtual try-on...          ← active during tryon-max polling
[ ] Applying background scenery...        ← only shown if background image provided
[ ] Finalising result...
```

Use a vertical stepper component. Completed steps show a checkmark. Current step shows a spinner. Future steps are greyed out.

---

## Prompt Builder (`/lib/prompt.ts`)

Build the prompt dynamically based on user inputs:

```
Base (always included):
"Make sure the model(s) wear the full set of wedding attire exactly as shown in the product image, according to their gender. Faces are the main priority — maintain the original face(s) exactly as they appear in the model photo, including facial expression. Do not alter, enhance, or change the expression in any way. If the model is not showing teeth in the original, do not show teeth. Keep a natural, unedited look true to the original face."

People count injection:
- 1 person: "There is one person in the model photo. Apply the attire to that single person only."
- 2 people: "There are two people in the model photo — a groom and a bride. Apply the appropriate wedding attire to each person according to their gender."

Posing style injection:
- sitting: "For the pose, the model(s) should be seated — if two people, seated side by side."
- standing: "For the pose, the model(s) should be standing — if two people, standing side by side."

Color injection (only if color selected):
"The attire color should be [color name or hex value]."

Background injection (only if NO background image uploaded):
"Set the scene on a beautiful white-themed 'pelamin kahwin' at a Malaysian-style wedding."
```

Concatenate all applicable parts in the order above, separated by a single space.

---

## Collection Tab

- Grid layout (2 columns on mobile, 3 on desktop)
- Each card shows:
  - Generated result image (thumbnail)
  - Date and time of generation
  - Pose style and people count badge
  - Color swatch (if used)
  - `Download` button
  - `View` button (opens full image in a modal/lightbox)
- Empty state: `No generations yet. Go to Studio to get started.`
- No delete functionality needed for POC

---

## API Routes

### POST `/api/upload`
- Accepts `multipart/form-data` with a `file` field
- Saves file to `/public/uploads/` with a UUID-based filename
- Returns `{ url: "${NEXT_PUBLIC_BASE_URL}/uploads/${filename}" }`

### POST `/api/generate`
- Accepts JSON body with all form inputs + uploaded image URLs
- Calls FASHN API Step 2 (tryon-max) and Step 3 (edit, if applicable)
- Handles polling internally (server-side) with timeout of 3 minutes max
- Returns `{ resultUrl: "..." }` or `{ error: "..." }`

### GET `/api/collection`
- Reads `/data/collection.json`
- Returns array of collection items sorted by timestamp descending

### POST `/api/collection`
- Appends new item to `/data/collection.json`
- Creates the file if it doesn't exist

---

## Error Handling
- If FASHN API returns `status: failed`, show the `error.message` to the user clearly
- If upload fails, show inline error under the upload field
- If polling times out (3 minutes), show a timeout message with a retry option
- All errors must be shown inline (no browser alerts)

---

## Design Guidelines
- **No emoji anywhere**
- Font: System font stack or Inter (via next/font)
- Color palette: Neutral — white, off-white, light grey, dark grey, black
- Accent: A single muted accent color (e.g. warm taupe `#C4A882`) for buttons and active states
- Borders: Subtle, `1px solid` light grey
- Border radius: Consistent, slightly rounded (`rounded-lg`)
- Spacing: Generous whitespace
- Mobile-first responsive layout
- Image previews: Fixed aspect ratio containers (`aspect-square` or `aspect-[3/4]`) with `object-cover`
- Loading spinner: Simple CSS border spinner, no external libraries
- Buttons: Clear primary/secondary distinction, no gradients

---

## Notes for Implementation
- All FASHN API calls must be made **server-side** (in `/api` routes) to protect the API key
- `FASHN_API_KEY` must never appear in client-side code
- `/public/uploads/` directory must exist and be writable — create it if missing on startup
- `/data/collection.json` must be created if it does not exist
- On GCP + Nginx, ensure Nginx serves the Next.js app and the `/public` folder is accessible at the configured `NEXT_PUBLIC_BASE_URL`
- Use `uuid` or `crypto.randomUUID()` for all generated filenames
- All uploaded images should be renamed to UUID-based names to avoid conflicts
