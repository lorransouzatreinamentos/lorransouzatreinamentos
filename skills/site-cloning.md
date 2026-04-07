---
name: site-cloning
description: "Protocolo sistemático de clonagem e re-branding de sites. Use quando o usuário diz 'clone este site', 're-skin', 'brand swap', ou pede para personalizar logo, copy, pricing, reviews, marcas confiáveis ou esquema de cores em um template clonado."
---

# Cloning Protocol

> **Purpose:** Take a cloned website template and systematically re-brand it for a new client by swapping six core elements: **Logo - Copy - Trusted Brands - Pricing - Reviews - Colour Scheme**.

---

## When to Use This Skill

- The user says "clone this website for [brand]"
- The user says "re-skin / rebrand / customise this template"
- The user references any of the six changeable elements below
- A repo has just been cloned and the user wants to make it their own

---

## Template Component Map

The cloned template is a **Vite + React + TypeScript** project. Below is a precise map of which files control which brandable element. Always verify paths by running `list_dir` first -- the repo structure may have been reorganised.

| # | Element | Primary Files | What to Change |
|---|---------|--------------|----------------|
| 1 | **Logo** | `components/Navbar.tsx`, `components/Footer.tsx`, `index.html` (`<title>`) | Logo icon/image, brand name text, favicon, `<title>` tag |
| 2 | **Copy** | `components/Hero.tsx`, `components/Features.tsx`, `components/Footer.tsx`, `components/CardScannerSection.tsx`, `components/AuditTool.tsx`, `index.html` | Headlines, sub-headlines, body paragraphs, CTA button labels, meta descriptions, badge text, section titles |
| 3 | **Trusted Brands** | `components/SocialProof.tsx` | Brand name strings in the `brands` array |
| 4 | **Pricing** | `components/Pricing.tsx` | Plan names, prices, feature lists, CTA labels, highlighted plan |
| 5 | **Reviews** | `components/Testimonials.tsx` | Reviewer names, roles, testimonial quotes, avatar images, ratings |
| 6 | **Colour Scheme** | **ALL components** + `components/ui/*` + `index.html` `<style>` block | Primary accent, gradient mid-points, background, muted text, button glows, shadow rgba values, volumetric effects, icon fills, border colors, selection color, scrollbar colors |

**Additional Components to Check:**
- `components/CardScannerSection.tsx` - headline gradients, section copy
- `components/AuditTool.tsx` - ALL accent colors throughout
- `components/StickyCTA.tsx` - floating CTA button colors and text
- `components/ui/gradient-menu.tsx` - any UI component colors
- `components/ui/gradient-menu-inline.tsx` - any UI component colors

---

## Workflow

Run through each phase **in order**. Do NOT skip ahead or begin implementing until all six phases of information gathering are complete.

### Phase 0 — Discovery

- [ ] **Confirm the repo is cloned** and identify the workspace root.
- [ ] **Run the site locally** (`npm install && npm run dev`) so changes can be previewed.
- [ ] Ask the user: *"What is the brand / company name for this new site?"*

### Phase 1 — Logo

Ask the user for:
- [ ] **Brand name** (text that replaces the original everywhere)
- [ ] **Logo image file** — request in these dimensions:
  - Navbar icon: **40 x 40 px** (PNG or SVG, transparent background)
  - Footer icon: **32 x 32 px** (PNG or SVG, transparent background)
  - Favicon: **32 x 32 px** (ICO or PNG)
- [ ] If the user does not have a logo image, offer to use a **Lucide icon**
- [ ] Confirm whether the icon background colour should match the new accent colour

### Phase 2 — Copy Changes

Ask the user for:

**Hero Section:**
- [ ] **Hero headline** - May be multi-line with different styling per line
- [ ] **Hero sub-headline / tagline**
- [ ] **Hero badge text**
- [ ] **Primary CTA label**
- [ ] **Secondary CTA label**

**Navigation:**
- [ ] **Navbar CTA label**
- [ ] **Navigation link labels**

**Sections with Gradient Headlines:**
- [ ] **CardScannerSection headline** (plain text + gradient text portion)
- [ ] **AuditTool section headline** (outline, gradient, accent color portions)

**Other Sections:**
- [ ] **Features section headline + sub-text**
- [ ] **Features card titles & descriptions**
- [ ] **Pricing section headline + sub-text**
- [ ] **Testimonials section headline**
- [ ] **Footer tagline + copyright text**
- [ ] **Footer column titles & links**
- [ ] **Page `<title>` and meta description** in `index.html`
- [ ] Review ALL button labels across components

**IMPORTANT:** When implementing multi-styled headlines:
- Preserve the HTML structure (line breaks, spans)
- Apply gradients via: `className="bg-gradient-to-r from-[...] via-[...] to-[...] bg-clip-text text-transparent"`
- Apply accent colors directly: `className="text-[#7C3AED]"`
- Apply stroke/outline effects: `className="text-transparent [-webkit-text-stroke:1px_white]"`

### Phase 3 — Trusted Brands Logos

Ask the user for:
- [ ] **List of brand names** to display in the marquee
- [ ] **Brand logo images** (optional) — height 48-64 px, SVG preferred
- [ ] Confirm the label above the marquee

### Phase 4 — Pricing

Ask the user for:
- [ ] **Number of pricing tiers**
- [ ] For **each tier**: Plan name, subtitle, price, feature bullets, highlighted?
- [ ] **CTA button label format**

### Phase 5 — Reviews / Testimonials

Ask the user for:
- [ ] **Number of testimonials**
- [ ] For **each**: Name, role/title, quote, star rating, avatar image (100 x 100 px)

### Phase 6 — Colour Scheme

Ask the user for:
- [ ] **Primary accent colour**
- [ ] **Background colour**
- [ ] **Muted text colour**
- [ ] **Secondary accent** (optional)
- [ ] **Gradient colors**
- [ ] **Selection highlight colours**
- [ ] If only one brand colour provided, **derive the full palette automatically**

---

## Implementation Protocol

Once **all six phases** of information have been collected and confirmed:

### Step 1 — Backup Verification
- [ ] Confirm the repo has git history so changes are recoverable.

### Step 2 — Colour Scheme (do this FIRST)
- [ ] Use `replace_all: true` in Edit tool for efficient color replacement
- [ ] Perform global find-and-replace for each color token
- [ ] Audit each component individually for missed colors
- [ ] Verify no hardcoded color values were missed

### Step 3 — Logo
### Step 4 — Copy
### Step 5 — Trusted Brands
### Step 6 — Pricing
### Step 7 — Reviews

### Step 8 — Final Verification
- [ ] Run `npm run dev` and visually verify in browser
- [ ] Comprehensive color audit using grep
- [ ] Check for any remaining references to old brand name
- [ ] Confirm all links, CTA buttons, and images render correctly
- [ ] Test responsive design on mobile viewport

---

## Asset Dimensions Summary

| Asset | Dimensions | Format | Notes |
|-------|-----------|--------|-------|
| Navbar logo icon | 40 x 40 px | SVG or PNG (transparent) | Square, used in rounded container |
| Footer logo icon | 32 x 32 px | SVG or PNG (transparent) | Matches navbar but smaller |
| Favicon | 32 x 32 px | ICO or PNG | Browser tab icon |
| Trusted brand logos | height 48-64 px | SVG preferred | Used in scrolling marquee |
| Testimonial avatars | 100 x 100 px | PNG or JPG | Square, displayed as circle |

---

## Gradient Handling Guide

### Types of Gradients You'll Encounter

1. **Button gradients:** `bg-gradient-to-r from-[#BFF549] via-[#FACC15] to-[#BFF549]`
2. **Text gradients (bg-clip-text):** Used for gradient headline text
3. **SVG gradients (for icons):** `<linearGradient>` definitions
4. **Shadow gradients (button glows):** `hover:shadow-[0_0_40px_rgba(...)]`

### Gradient Replacement Strategy

- For 3-color gradients: Use `from-[primary] via-[lighter] to-[primary]`
- Deriving the mid-point color: Lighten primary by 15% or shift hue slightly

---

## Error Handling

- If `npm install` fails -> check Node.js version (needs >= 18)
- If colors look wrong after replacement: run grep for hex codes with mixed case
- If logo images don't load -> verify paths are relative to `/public/`
- If TypeScript errors appear after changes -> focus on visual verification in the browser

## Interaction Style

- Be **systematic** — work through phases 1-6 in order
- Be **specific** — when asking for assets, always state the exact dimensions and preferred format
- Be **efficient** — ask for all items within a phase in a single message
- Be **confirmatory** — before implementing, summarise all collected information and get a final "go"
- **Never assume** — if the user hasn't provided something, ask
