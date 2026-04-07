---
name: empire-landing
description: "Cria landing pages premium estilo Empire Metaverse com tipografia oversized, scroll parallax, rotação 3D e glow effects. React + Framer Motion + Tailwind CSS."
user_invocable: true
---

# Empire Landing Page

## Contexto

Usar quando o usuário precisa de uma landing page premium com estética dark/futurista ou light/clean, inspirada no estilo Empire Metaverse. A página usa tipografia oversized como elemento principal, com um objeto visual central (imagem, produto, avatar) sobrepondo o texto, criando profundidade. Scroll parallax com rotação 3D do elemento central gera a sensação cinematográfica.

**Stack:** React + Framer Motion + Tailwind CSS (zero dependências extras)
**Tempo estimado:** 30-60 minutos
**Resultado:** Landing page completa, responsiva, performática

## Inputs

O usuário deve fornecer:

| Input | Obrigatório | Exemplo |
|-------|-------------|---------|
| Nome do projeto/marca | Sim | "DOMINA.IA" |
| Headline principal | Sim | "DOMINE O FUTURO" |
| Subheadline | Sim | "Inteligência Artificial para empresários" |
| Imagem do elemento central | Sim | URL ou path da imagem (produto, avatar, mockup) |
| Tema | Não (default: dark) | "dark" ou "light" |
| Seções desejadas | Não (default: todas) | Hero, Editorial, Categories, Stats, Features, CTA, Footer |
| Cores da marca | Não (default: roxo/azul) | Primary: #8B5CF6, Accent: #06B6D4 |
| CTA text | Não (default: "Comece Agora") | "Quero Participar" |
| CTA link | Sim | URL do checkout ou formulário |

## Processo

### Fase 1 — Setup do Projeto

Se o projeto já existe, pular para Fase 2. Se não:

```bash
npx create-react-app empire-landing --template typescript
cd empire-landing
npm install framer-motion
# Tailwind já deve estar configurado ou instalar:
npm install -D tailwindcss @tailwindcss/vite
```

**Estrutura de arquivos a criar:**

```
src/
  components/
    EmpireLanding.tsx          # Componente principal (orquestrador)
    HeroSection.tsx            # Hero com tipografia oversized + elemento central
    EditorialSection.tsx       # Seção editorial com parallax
    CategoriesSection.tsx      # Grid de categorias/serviços
    StatsSection.tsx           # Números/métricas animados
    FeaturesSection.tsx        # Features com ícones
    CTASection.tsx             # Call-to-action final
    FooterSection.tsx          # Footer
    ParticleField.tsx          # Partículas decorativas
    GlowOrb.tsx               # Orb com glow effect
  hooks/
    useParallax.ts             # Hook de parallax reutilizável
  styles/
    empire.css                 # Estilos customizados (glow, grid)
  config/
    empire-config.ts           # Configuração centralizada (cores, textos, URLs)
```

### Fase 2 — Configuração Centralizada

Criar `empire-config.ts` com todos os parâmetros configuráveis:

```typescript
// src/config/empire-config.ts
export const empireConfig = {
  // Marca
  brand: {
    name: "DOMINA.IA",
    tagline: "Inteligência Artificial para Empresários",
  },

  // Tema: "dark" | "light"
  theme: "dark" as const,

  // Cores
  colors: {
    dark: {
      bg: "#030014",
      bgSecondary: "#0a0a1a",
      text: "#ffffff",
      textMuted: "#a0a0b0",
      primary: "#8B5CF6",
      primaryGlow: "rgba(139, 92, 246, 0.4)",
      accent: "#06B6D4",
      accentGlow: "rgba(6, 182, 212, 0.3)",
      cardBg: "rgba(255, 255, 255, 0.03)",
      cardBorder: "rgba(255, 255, 255, 0.08)",
    },
    light: {
      bg: "#fafafa",
      bgSecondary: "#ffffff",
      text: "#1a1a2e",
      textMuted: "#6b7280",
      primary: "#7c3aed",
      primaryGlow: "rgba(124, 58, 237, 0.2)",
      accent: "#0891b2",
      accentGlow: "rgba(8, 145, 178, 0.15)",
      cardBg: "rgba(0, 0, 0, 0.02)",
      cardBorder: "rgba(0, 0, 0, 0.08)",
    },
  },

  // Hero
  hero: {
    headline: "DOMINE\nO FUTURO",
    subheadline: "Inteligência Artificial aplicada ao seu negócio",
    centralImage: "/hero-element.png",
    ctaText: "Comece Agora",
    ctaLink: "#cta",
  },

  // Stats
  stats: [
    { value: "500+", label: "Empresários" },
    { value: "R$2M+", label: "Faturamento Gerado" },
    { value: "15x", label: "ROAS Médio" },
    { value: "98%", label: "Satisfação" },
  ],

  // Features
  features: [
    {
      icon: "brain",
      title: "IA Aplicada",
      description: "Ferramentas de IA configuradas para o seu negócio",
    },
    // ... mais features
  ],

  // CTA Final
  cta: {
    headline: "Pronto para Dominar?",
    subheadline: "Vagas limitadas para a próxima turma",
    buttonText: "QUERO PARTICIPAR",
    buttonLink: "https://checkout.example.com",
  },
};
```

### Fase 3 — Hook de Parallax

```typescript
// src/hooks/useParallax.ts
import { useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";

interface ParallaxConfig {
  offsetStart?: number;    // 0 = topo da viewport, 1 = fundo
  offsetEnd?: number;
  inputRange?: [number, number];
  outputRange?: [number, number];
}

export function useParallax(config: ParallaxConfig = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    offsetStart = 0,
    offsetEnd = 1,
  } = config;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`start ${offsetStart}`, `end ${offsetEnd}`],
  });

  // Helpers pré-configurados
  const y = (range: [number, number]) =>
    useTransform(scrollYProgress, [0, 1], range);

  const scale = (range: [number, number]) =>
    useTransform(scrollYProgress, [0, 1], range);

  const opacity = (range: [number, number]) =>
    useTransform(scrollYProgress, [0, 1], range);

  const rotateX = (range: [number, number]) =>
    useTransform(scrollYProgress, [0, 1], range);

  const rotateY = (range: [number, number]) =>
    useTransform(scrollYProgress, [0, 1], range);

  return { ref, scrollYProgress, y, scale, opacity, rotateX, rotateY };
}
```

### Fase 4 — HeroSection (núcleo da skill)

Este é o componente mais crítico. A técnica principal:

1. **Tipografia oversized** com `clamp()` para responsividade
2. **Elemento central** posicionado sobre o texto com `absolute` + `z-index`
3. **CTAs acima do elemento** com `z-index` mais alto
4. **Parallax** no scroll: elemento central rota em 3D

```typescript
// src/components/HeroSection.tsx
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax transforms
  const imageY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const imageRotateX = useTransform(scrollYProgress, [0, 1], [0, 15]);
  const imageRotateY = useTransform(scrollYProgress, [0, 0.5], [0, -8]);
  const imageScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      {/* Background grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orb atrás do elemento central */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                    w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"
        style={{ background: "var(--color-primary-glow)" }}
      />

      {/* Tipografia oversized — CAMADA 1 (fundo) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-[1]"
        style={{ opacity: textOpacity, y: textY }}
      >
        <h1
          className="text-center font-black uppercase leading-[0.85] tracking-tight select-none"
          style={{
            fontSize: "clamp(4rem, 15vw, 14rem)",
            background: "linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.4) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          DOMINE
          <br />
          O FUTURO
        </h1>
      </motion.div>

      {/* Elemento central (imagem/produto) — CAMADA 2 (meio) */}
      <motion.div
        className="relative z-[2] w-[clamp(280px,50vw,600px)]"
        style={{
          y: imageY,
          rotateX: imageRotateX,
          rotateY: imageRotateY,
          scale: imageScale,
          transformStyle: "preserve-3d",
        }}
      >
        <img
          src="/hero-element.png"
          alt="Elemento central"
          className="w-full h-auto drop-shadow-2xl"
          style={{
            filter: "drop-shadow(0 0 40px rgba(139, 92, 246, 0.3))",
          }}
        />
      </motion.div>

      {/* CTA buttons — CAMADA 3 (frente, ACIMA do elemento) */}
      <motion.div
        className="absolute bottom-[15%] z-[3] flex flex-col items-center gap-4"
        style={{ opacity: textOpacity }}
      >
        <motion.a
          href="#cta"
          className="px-8 py-4 rounded-full font-bold text-lg 
                     bg-gradient-to-r from-purple-600 to-cyan-500
                     text-white shadow-lg shadow-purple-500/25
                     hover:shadow-purple-500/40 transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          COMECE AGORA
        </motion.a>
        <p className="text-sm text-white/50">Vagas limitadas</p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 z-[3]"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
```

**Decisões de design críticas:**

- `z-[1]` para texto, `z-[2]` para imagem, `z-[3]` para CTAs — isso garante que o CTA seja sempre clicável mesmo sobre a imagem
- `clamp(4rem, 15vw, 14rem)` escala a tipografia de mobile (4rem) a desktop (14rem) suavemente
- `perspective: 1200px` no container pai habilita os transforms 3D
- `transformStyle: preserve-3d` no elemento central mantém a profundidade
- `leading-[0.85]` comprime o line-height para o texto oversized ficar compacto

### Fase 5 — ParticleField

Partículas decorativas limitadas para performance:

```typescript
// src/components/ParticleField.tsx
import { motion } from "framer-motion";
import { useMemo } from "react";

interface ParticleFieldProps {
  count?: number;  // MAX 30 para performance
  color?: string;
}

export function ParticleField({ count = 20, color = "rgba(139, 92, 246, 0.3)" }: ParticleFieldProps) {
  // Gerar posições uma única vez (useMemo, não em cada render)
  const particles = useMemo(() =>
    Array.from({ length: Math.min(count, 30) }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: color,
            // IMPORTANTE: usar blur ESTÁTICO (CSS), não animado
            filter: `blur(${p.size * 0.5}px)`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
```

**Decisão de performance:** Blur é ESTÁTICO (via CSS filter fixo), não animado. Animar blur causa repaints caros. Apenas y e opacity são animados.

### Fase 6 — EditorialSection (parallax de conteúdo)

```typescript
// src/components/EditorialSection.tsx
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function EditorialSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const leftX = useTransform(scrollYProgress, [0, 0.5], [-100, 0]);
  const rightX = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section ref={ref} className="py-32 px-6 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        {/* Texto entra da esquerda */}
        <motion.div style={{ x: leftX, opacity: contentOpacity }}>
          <h2
            className="font-bold leading-tight mb-6"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
          >
            Transforme seu negócio com IA
          </h2>
          <p className="text-lg text-white/60 leading-relaxed">
            Descrição editorial do produto/serviço. Texto longo que
            explica o valor e a transformação que o cliente terá.
          </p>
        </motion.div>

        {/* Imagem entra da direita */}
        <motion.div style={{ x: rightX, opacity: contentOpacity }}>
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-white/5 flex items-center justify-center">
            <span className="text-white/20 text-sm">Imagem editorial</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

### Fase 7 — StatsSection (números animados)

```typescript
// src/components/StatsSection.tsx
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface Stat {
  value: string;
  label: string;
}

export function StatsSection({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.15, duration: 0.6 }}
          >
            <div
              className="font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              {stat.value}
            </div>
            <div className="text-sm text-white/50 mt-2 uppercase tracking-wider">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

### Fase 8 — CTASection

```typescript
// src/components/CTASection.tsx
import { motion } from "framer-motion";

interface CTAConfig {
  headline: string;
  subheadline: string;
  buttonText: string;
  buttonLink: string;
}

export function CTASection({ config }: { config: CTAConfig }) {
  return (
    <section id="cta" className="py-32 px-6 relative overflow-hidden">
      {/* Glow de fundo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
      />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.h2
          className="font-black leading-tight mb-6"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {config.headline}
        </motion.h2>

        <motion.p
          className="text-xl text-white/50 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {config.subheadline}
        </motion.p>

        <motion.a
          href={config.buttonLink}
          className="inline-block px-12 py-5 rounded-full font-bold text-xl
                     bg-gradient-to-r from-purple-600 to-cyan-500
                     text-white shadow-2xl shadow-purple-500/30
                     hover:shadow-purple-500/50 transition-all duration-300"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {config.buttonText}
        </motion.a>
      </div>
    </section>
  );
}
```

### Fase 9 — CSS Global (empire.css)

```css
/* src/styles/empire.css */

/* Custom properties baseadas no tema */
:root {
  --color-bg: #030014;
  --color-bg-secondary: #0a0a1a;
  --color-text: #ffffff;
  --color-text-muted: #a0a0b0;
  --color-primary: #8B5CF6;
  --color-primary-glow: rgba(139, 92, 246, 0.4);
  --color-accent: #06B6D4;
  --color-accent-glow: rgba(6, 182, 212, 0.3);
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}

/* Prevenir overflow horizontal */
body {
  overflow-x: hidden;
  background: var(--color-bg);
  color: var(--color-text);
}

/* Glow keyframe para elementos pulsantes */
@keyframes glow-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* Seleção com cor da marca */
::selection {
  background: rgba(139, 92, 246, 0.3);
  color: #fff;
}
```

### Fase 10 — Composição Final

```typescript
// src/components/EmpireLanding.tsx
import { HeroSection } from "./HeroSection";
import { EditorialSection } from "./EditorialSection";
import { StatsSection } from "./StatsSection";
import { CTASection } from "./CTASection";
import { ParticleField } from "./ParticleField";
import { empireConfig } from "../config/empire-config";
import "../styles/empire.css";

export function EmpireLanding() {
  return (
    <div className="relative min-h-screen" style={{ background: "var(--color-bg)" }}>
      <ParticleField count={20} />
      <HeroSection />
      <EditorialSection />
      <StatsSection stats={empireConfig.stats} />
      {/* Features, Categories — seguir mesmo padrão */}
      <CTASection config={empireConfig.cta} />
      {/* Footer */}
    </div>
  );
}
```

### Fase 11 — Checklist de Qualidade

Antes de considerar a landing pronta, validar:

- [ ] Tipografia oversized escala corretamente de mobile a desktop (testar em 375px, 768px, 1440px)
- [ ] Elemento central sobrepõe o texto corretamente
- [ ] CTAs estão ACIMA do elemento central (clicáveis)
- [ ] Scroll parallax funciona suavemente (60fps)
- [ ] Rotação 3D do elemento central é perceptível mas não exagerada (max 15deg)
- [ ] Glow effects não causam lag (blur é estático)
- [ ] Partículas limitadas a 30 max
- [ ] Responsivo: todas as seções funcionam em mobile
- [ ] Links do CTA funcionam
- [ ] Performance: Lighthouse > 90

### Decisões de Design Documentadas

| Decisão | Justificativa |
|---------|---------------|
| `clamp()` em vez de breakpoints | Escala fluida, menos CSS, zero saltos |
| Blur estático nas partículas | Blur animado causa repaint; estático usa GPU |
| Max 30 partículas | Acima disso, mobile sofre com jank |
| `perspective: 1200px` | Valor médio — 800px é muito intenso, 2000px é imperceptível |
| z-index em 3 camadas (1/2/3) | Garante que CTA sempre seja clicável sobre a imagem |
| `useScroll` com target | Evita cálculos globais; cada seção controla seu próprio parallax |
| `leading-[0.85]` no headline | Line-height comprimido faz tipografia oversized parecer intencional |
| Glow com `blur-[120px]` | Grande o suficiente para ser ambiente, não focal |

## Output

A skill entrega:

1. **Landing page completa** com todas as seções configuradas
2. **Arquivo de configuração** centralizado para fácil customização
3. **Componentes modulares** reutilizáveis em outros projetos
4. **Zero dependências extras** além de React + Framer Motion + Tailwind
5. **Performance otimizada** para mobile e desktop

## Variantes

### Dark Premium (padrão)
- Fundo `#030014`, texto branco, glow roxo/cyan
- Ideal para: tech, SaaS, eventos, cursos premium

### Light Clean
- Trocar `empireConfig.theme` para `"light"`
- Fundo `#fafafa`, texto escuro, glow mais suave
- Ajustar: gradientes de texto para cores escuras, borders mais visíveis
- Ideal para: saúde, educação, serviços corporativos

### Sem Parallax (performance extrema)
- Remover `useScroll`/`useTransform` do HeroSection
- Manter apenas animações de entrada (fade in)
- Ideal para: dispositivos antigos, público com motion sensitivity
