---
name: gohighlevel-convert
description: "Converte qualquer codebase de site (React, Next.js, Vue, Svelte, etc.) em um único arquivo HTML compatível com o bloco Custom HTML/Javascript do GoHighLevel."
---

# GoHighLevel Website Converter

## When to use this skill
- User wants to upload a website to GoHighLevel (GHL)
- User asks to convert a React/Next/Vue/Svelte site into a single HTML file
- User mentions "GoHighLevel", "GHL", or "Custom HTML block"
- User wants a single-file version of a multi-file website project
- User wants to paste a website into a page builder's custom code block

## Key Constraints (GHL Custom HTML Block)
GoHighLevel's Custom HTML/Javascript block has strict limitations:

- **No JSX / No Babel** — `type="text/babel"` scripts are silently ignored
- **No ES modules** — `import`/`export` and `type="module"` do not work
- **No build tools** — No Vite, Webpack, or bundler output
- **No Node.js APIs** — `process.env`, `require()`, etc. are unavailable
- **No `<html>`, `<head>`, `<body>` tags** — GHL wraps your code in its own page shell
- **Pure HTML + `<style>` + `<script>` only** — vanilla JS, CSS, inline SVGs
- **CDN `<link>` and `<script src="">` tags** — external resources load fine
- **Google Fonts, Tailwind CDN, external images** — all work

## Workflow

Use this checklist when converting a site:

```markdown
- [ ] 1. Audit the source project (framework, components, dependencies)
- [ ] 2. Identify removable features (auth, databases, server APIs)
- [ ] 3. Map all visual components to pure HTML/CSS equivalents
- [ ] 4. Convert all icons to inline SVGs (no icon library imports)
- [ ] 5. Convert all animations to CSS keyframes or vanilla JS
- [ ] 6. Prefix all CSS classes to avoid GHL style conflicts
- [ ] 7. Write the single output file
- [ ] 8. Validate: no imports, no JSX, no modules, no <html>/<head>/<body>
- [ ] 9. Inform user to Cmd+A -> Cmd+C -> paste into GHL
```

## Step-by-Step Instructions

### Step 1: Audit the Source Project
- Read `package.json` to identify the framework and dependencies
- List all components in the project (check `components/`, `src/`, `pages/`)
- Read every component file to understand the full visual structure
- Note which dependencies are visual-only vs. backend/API

### Step 2: Classify Dependencies

| Category | Action | Examples |
|----------|--------|---------|
| **Visual frameworks** | Replace with vanilla HTML/CSS | React, Vue, Svelte |
| **Animation libs** | Convert to CSS `@keyframes` | Framer Motion, GSAP |
| **Icon libraries** | Convert to inline `<svg>` | Lucide, Heroicons, FontAwesome |
| **CSS frameworks** | Load via CDN `<link>` or inline | Tailwind, Bootstrap |
| **Google Fonts** | Keep as `<link>` tags | Any Google Font |
| **Auth/Database** | **Remove entirely** | Supabase, Firebase, Auth0 |
| **Server APIs** | **Remove or mock** | Gemini, OpenAI, Stripe |
| **Analytics** | **Remove** (GHL has its own) | Vercel Analytics, GA |

### Step 3: Convert Components to Pure HTML

For each component in the source project:

1. **Extract the JSX/template** and convert to plain HTML
2. **Extract all Tailwind/CSS classes** and convert to vanilla CSS
3. **Replace all React state/hooks** with vanilla JS or CSS-only solutions
4. **Replace all `map()` renders** with static repeated HTML
5. **Replace all icon component imports** with inline `<svg>` elements

### Step 4: CSS Class Prefixing
To prevent conflicts with GHL's built-in styles, prefix ALL CSS classes:

```
Bad:  .hero, .nav, .card, .btn
Good: .vf-hero, .vf-nav, .vf-card, .vf-btn
```

Use a short, unique prefix based on the project name.

### Step 5: Animation Conversion

Convert framework animations to CSS:

```css
/* Framer Motion fade-in -> CSS equivalent */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.vf-animate { animation: fadeInUp 0.6s ease-out forwards; }
```

For scroll-triggered animations, use Intersection Observer in vanilla JS:

```javascript
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
  observer.observe(el);
});
```

### Step 6: Output File Structure

The final file must follow this exact structure:

```html
<!-- 1. External CDN links (fonts, optional Tailwind) -->
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">

<!-- 2. All CSS in a single <style> block -->
<style>
  /* Reset + all component styles + animations + responsive */
</style>

<!-- 3. All HTML in a single wrapper div -->
<div class="prefix-wrap">
  <!-- nav -->
  <!-- hero -->
  <!-- sections -->
  <!-- footer -->
</div>

<!-- 4. All JS in a single <script> block at the end -->
<script>
  // Scroll effects, interactivity, drag handlers
</script>
```

**NEVER include**: `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` — GHL provides these.

### Step 7: Validation Checklist

Before delivering the file, verify:

```markdown
- [ ] No `import` or `export` statements anywhere
- [ ] No `type="module"` or `type="text/babel"` on any script tag
- [ ] No JSX syntax (no `<Component />`, no `{}` expressions in HTML)
- [ ] No `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>` tags
- [ ] No `process.env`, `import.meta`, or Node.js APIs
- [ ] All icons are inline SVGs (no lucide-react, no heroicons imports)
- [ ] All CSS classes are prefixed to avoid GHL conflicts
- [ ] All animations use CSS @keyframes or vanilla JS
- [ ] File renders correctly when opened directly in a browser
- [ ] Responsive: looks good on mobile, tablet, and desktop
```

### Step 8: Delivery Instructions

Tell the user:
1. Open the generated `.html` file in their editor
2. **Cmd+A** (Select All) -> **Cmd+C** (Copy)
3. In GoHighLevel page builder, add a **Custom Code** element
4. Click **Open Code Editor**
5. **Cmd+V** (Paste) into the Custom Javascript/HTML box
6. Click **Save**
7. Preview or Publish the page
