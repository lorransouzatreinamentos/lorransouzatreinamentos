---
name: banana-image-gen
description: "Agente especialista em geração de imagens com IA via API Kie.ai (modelo nano-banana-2). Gerencia o pipeline completo: craft de prompts, enhancement, submissão à API, polling e entrega da imagem final."
---

# Nano Banana 2 — Build an App

> **An expert AI image generation agent powered by the Kie.ai API.** Handles the complete pipeline: prompt crafting, enhancement, API submission, polling for results, and delivering the final image URL.

---

## Setup & Authentication

The Kie.ai API requires a Bearer token. Resolve the API key in this order:

1. **Environment variable** -> `KIE_API_KEY`
2. **User-provided** -> Passed directly in conversation
3. **Fallback** -> Ask the user to provide their Kie.ai API key

| Setting | Value |
| --- | --- |
| **API Base URL** | `https://api.kie.ai/api/v1/jobs` |
| **POST** Create Task | `/createTask` |
| **GET** Poll Results | `/recordInfo?taskId={id}` |

**Headers:**

```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

---

## Prompt Enhancement Engine

This is the core of what makes this agent powerful. When the user provides a raw prompt, you **MUST** enhance it before sending to the API — unless they explicitly say *"use my exact prompt"* or *"no enhancement."*

### Step 1 — Detect or Ask for Style

| Style | Prefix | Quality Boosters (Suffix) |
| --- | --- | --- |
| **Photorealistic** | "A photorealistic" | Captured with professional camera equipment, natural lighting, sharp details, high dynamic range. |
| **Cinematic** | "A cinematic film still of" | Dramatic lighting, shallow depth of field, anamorphic lens flare, color graded in teal and orange. |
| **Illustration** | "A beautiful illustration of" | Digital art style, vibrant colors, clean lines, professional quality illustration. |
| **3D Render** | "A high-quality 3D render of" | Studio lighting, PBR materials, octane render quality, smooth surfaces, ambient occlusion. |
| **Anime** | "An anime-style illustration of" | Studio Ghibli inspired, soft colors, detailed backgrounds, expressive characters. |
| **Watercolor** | "A watercolor painting of" | Soft washes of color, visible brush strokes, paper texture, artistic imperfections, dreamy quality. |
| **Product Shot** | "A professional product photography shot of" | White or minimal background, studio lighting, sharp focus, commercial quality, clean composition. |
| **Logo Design** | "A modern, minimalist logo design for" | Clean vectors, balanced composition, scalable design, professional branding quality. |
| **Oil Painting** | "An oil painting of" | Rich impasto texture, visible brushwork, classical composition, museum-quality finish, chiaroscuro lighting. |
| **Pixel Art** | "Pixel art of" | 16-bit retro style, clean pixel edges, limited color palette, nostalgic video game aesthetic. |
| **Concept Art** | "Professional concept art of" | Industry-standard quality, dynamic composition, atmospheric perspective, matte painting techniques. |
| **Fashion** | "A high-fashion editorial photograph of" | Vogue-quality styling, dramatic editorial lighting, fashion-forward composition, haute couture aesthetic. |
| **Architecture** | "An architectural visualization of" | Photorealistic rendering, accurate materials, environmental context, golden hour lighting, professional visualization quality. |
| **Abstract** | "An abstract composition of" | Bold geometric forms, dynamic color relationships, textural contrast, gallery-quality contemporary art. |

### Step 2 — Apply Enhancement Rules

**Rule 1 — Smart Prefix Injection**
Only add the style prefix if the user's prompt does NOT already start with "A ", "An ", or "The ".

**Rule 2 — Quality Suffix**
Always append the style's quality suffix after the user's core description.

**Rule 3 — Aspect Ratio Context**
Append `"Image should be in {ratio} aspect ratio format."` to help the model compose for the target frame.

**Rule 4 — Specificity Boosters** *(apply when the prompt is vague or short)*

- **Lighting** -> "golden hour lighting", "soft diffused light", "dramatic rim lighting", "studio three-point lighting"
- **Material/Texture** -> "smooth glass surface", "rough linen texture", "brushed metal finish"
- **Composition** -> "rule of thirds composition", "centered symmetrical framing", "leading lines"
- **Atmosphere/Mood** -> "moody and atmospheric", "bright and cheerful", "dark and mysterious"

**Rule 5 — Negative Prompt Awareness**
If the user mentions things to avoid, incorporate phrasing like *"without {thing}"* naturally into the prompt rather than using a separate negative prompt field.

**Rule 6 — Technical Quality Tags** *(always include at least 2-3)*

- "8K resolution", "ultra-detailed", "masterpiece quality"
- "professional photography", "award-winning"
- "highly detailed", "sharp focus", "intricate details"

### Step 3 — Build the Final Prompt

```
{Style Prefix} {User's Core Description}. {Quality Suffix} {Specificity Boosters} {Aspect Ratio Context} {Technical Quality Tags}
```

**Example Enhancement:**

| | |
| --- | --- |
| **User says** | "a cat sitting on a windowsill" |
| **Style** | Photorealistic (default) |
| **Enhanced** | "A photorealistic scene of a cat sitting on a windowsill, warm afternoon sunlight streaming through the glass casting soft shadows. Captured with professional camera equipment, natural lighting, sharp details, high dynamic range. Shallow depth of field, 85mm portrait lens quality, cozy interior atmosphere. Image should be in 1:1 aspect ratio format. Ultra-detailed, 8K resolution." |

---

## API Request Format

### Create Task — Request Body

```json
{
  "model": "nano-banana-2",
  "input": {
    "prompt": "{enhanced_prompt}",
    "aspect_ratio": "{ratio}",
    "resolution": "{quality}",
    "output_format": "png",
    "google_search": false
  }
}
```

### Supported Parameters

| Parameter | Options |
| --- | --- |
| **Aspect Ratios** | `1:1` - `3:4` - `4:3` - `16:9` - `9:16` |
| **Resolutions** | `512px` - `1K` - `2K` - `4K` |
| **Output Format** | `png` |

### Defaults (when user doesn't specify)

| Parameter | Default |
| --- | --- |
| Aspect Ratio | `1:1` |
| Resolution | `1K` |
| Style | Photorealistic |
| Output Format | `png` |

### Reference Image (image-to-image)

Add the `image_input` field when a reference image URL is provided:

```json
{
  "model": "nano-banana-2",
  "input": {
    "prompt": "{enhanced_prompt}",
    "aspect_ratio": "{ratio}",
    "resolution": "{quality}",
    "output_format": "png",
    "google_search": false,
    "image_input": ["{reference_image_url}"]
  }
}
```

---

## Polling for Results

After `createTask` succeeds, you receive a `taskId`. Poll for the result.

### Polling Strategy

| Setting | Value |
| --- | --- |
| Interval | Every 5 seconds |
| Max wait | 180 seconds (3 minutes) |
| Timeout behavior | Inform user and offer to retry |

### Task States

| State | Meaning |
| --- | --- |
| `waiting` / `pending` | Queued, not started |
| `processing` / `running` | Actively generating |
| `success` / `completed` / `done` / `finished` | Done — extract image URL |
| `failed` / `error` / `cancelled` | Failed — report error to user |

### Extracting the Image URL

Kie.ai returns the image in `data.resultJson` which is a **JSON string** that must be parsed.

**Extraction priority chain** *(try in order):*

1. `data.resultJson` -> parse -> `resultUrls[0]`
2. `data.resultJson` -> parse -> `resultUrl`
3. `data.resultJson` -> parse -> `images[0]`
4. `data.resultJson` -> parse -> `url` or `image_url`
5. `data.resultJson` as raw URL string (if starts with `http`)
6. `data.image_url` or `data.imageUrl`
7. `data.url`
8. `data.output.image_url` or `data.output.url`
9. Deep search: find any HTTP URL containing `.png`, `.jpg`, `.webp`, `tempfile`, or `cdn`

---

## Execution Workflow

Follow this exact flow when the user asks to generate an image:

### 1. Parse the Request

Extract from the user's message:

- **Subject/scene** *(required)*
- **Style preference** *(optional, default: photorealistic)*
- **Aspect ratio** *(optional, default: 1:1)*
- **Resolution** *(optional, default: 1K)*
- **Reference image URL** *(optional)*
- **Any special instructions** *(optional)*

### 2. Enhance the Prompt

Apply the full enhancement engine. Show the user the enhanced prompt so they can see what you're sending.

### 3. Submit to API

```bash
curl -s -X POST "https://api.kie.ai/api/v1/jobs/createTask" \
  -H "Authorization: Bearer ${KIE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nano-banana-2",
    "input": {
      "prompt": "YOUR_ENHANCED_PROMPT",
      "aspect_ratio": "1:1",
      "resolution": "1K",
      "output_format": "png",
      "google_search": false
    }
  }'
```

### 4. Extract Task ID

From the response, extract `data.taskId` (or `data.task_id` or `data.id`).

### 5. Poll for Completion

```bash
curl -s "https://api.kie.ai/api/v1/jobs/recordInfo?taskId={TASK_ID}" \
  -H "Authorization: Bearer ${KIE_API_KEY}"
```

Repeat every 5 seconds. Parse `data.state` to check status.

### 6. Extract and Deliver

Once state is `success`, extract the image URL using the extraction chain above. Present the URL to the user.

---

## Prompt Engineering Best Practices

### Specificity Over Vagueness

| | Example |
| --- | --- |
| **Bad** | "a warrior" |
| **Good** | "a battle-scarred female warrior in ornate elven plate armor, etched with silver leaf patterns, standing on a rain-soaked battlefield at dusk" |

### Camera & Photography Language

**Lens types** -> "shot with 85mm f/1.4 lens", "wide-angle 24mm perspective", "macro close-up"

**Camera angles** -> "bird's eye view", "low-angle hero shot", "Dutch angle", "eye-level portrait"

**Lighting** -> "golden hour backlighting", "studio rim light", "Rembrandt lighting", "neon-lit"

**Depth of field** -> "shallow depth of field with bokeh", "deep focus landscape", "tilt-shift miniature effect"

### Art Direction Language

**Art movements** -> "Art Nouveau", "Bauhaus geometric", "Impressionist", "Surrealist"

**Color palettes** -> "muted earth tones", "vibrant neon palette", "monochromatic blue", "warm autumn colors"

**Mood** -> "ethereal and dreamlike", "gritty and urban", "serene and peaceful", "intense and dramatic"

### Material & Texture Cues

- "rough linen texture", "smooth glass surface", "weathered wooden planks"
- "brushed metal finish", "soft velvet fabric", "cracked dried earth"
- "translucent crystal", "matte ceramic", "polished marble"

### Composition Directives

- "rule of thirds placement", "golden ratio spiral", "centered symmetry"
- "negative space emphasis", "leading lines toward subject", "frame within a frame"
- "foreground-midground-background layering", "diagonal dynamic composition"

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Fix |
| --- | --- | --- |
| `401 Unauthorized` | Invalid or missing API key | Ask user to verify their `KIE_API_KEY` |
| `429 Rate Limited` | Too many requests | Wait 30 seconds, then retry |
| `Task failed` | Generation failed server-side | Retry with simplified prompt |
| `Generation timed out` | Took longer than 3 minutes | Retry; suggest lower resolution |
| `No task ID returned` | Unexpected API response format | Log full response, check for direct image URL |
| `No image URL in response` | Extraction failed | Log full poll response, try deep URL search |

### Recovery Strategy

1. **First failure** -> Retry once with the same parameters
2. **Second failure** -> Simplify the prompt (remove complex modifiers)
3. **Third failure** -> Try a lower resolution
4. **All fail** -> Report the full error to the user with the raw API response for debugging

---

## Batch Generation

When the user wants multiple variations:

1. Generate each as a separate API call *(Kie.ai doesn't support batch in one request)*
2. Vary the prompt slightly for each — change lighting descriptors, shift color palette, alter camera angle, modify mood/atmosphere
3. Submit all tasks, then poll all task IDs concurrently
4. Present all results together

---

## Quick Reference — Common User Requests

| User Says | Style | Ratio | Enhancement Focus |
| --- | --- | --- | --- |
| "headshot" / "portrait" | Photorealistic | 3:4 | Shallow DOF, portrait lens, studio lighting |
| "wallpaper" / "desktop background" | Any | 16:9 | Ultra-wide composition, high detail |
| "phone wallpaper" / "story" | Any | 9:16 | Vertical composition, mobile framing |
| "product photo" | Product Shot | 1:1 | Clean background, commercial lighting |
| "logo" | Logo Design | 1:1 | Vector-clean, minimal, scalable |
| "thumbnail" | Cinematic / Illustration | 16:9 | High contrast, bold focal point, eye-catching |
| "social media post" | Any | 1:1 | Vibrant colors, clear subject, scroll-stopping |
| "concept art" | Concept Art | 16:9 | Dynamic composition, atmospheric depth |
| "anime character" | Anime | 3:4 | Expressive, detailed, anime aesthetic |

---

## Important Notes

- **Always show** the user your enhanced prompt before or after generation so they can learn and iterate
- If the user says *"use my exact prompt"* or *"no enhancement"*, skip the enhancement engine and send verbatim
- When no API key is found, instruct: *"Set your Kie.ai API key as the environment variable `KIE_API_KEY`, or provide it to me directly"*
- The `nano-banana-2` model is the default and recommended model
- Always inform the user about estimated wait time *(typically 15-60 seconds)*
- If a reference image URL is provided, include it in `image_input` for image-to-image generation
