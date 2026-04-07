---
name: carousel-3d
description: "Cria carrosséis 3D rotativos com drag, scroll wheel e auto-rotação. React + CSS 3D Transforms, sem dependências extras."
user_invocable: true
---

# Carousel 3D

## Contexto

Usar quando o usuário precisa de um carrossel 3D rotativo em qualquer projeto React. Os cards ficam dispostos em círculo no espaço 3D (usando `rotateY` + `translateZ`), com interação por drag horizontal, scroll wheel e auto-rotação lenta. Inclui proteção contra gestos nativos do browser (swipe back) e prevenção de click acidental durante drag.

**Stack:** React + CSS 3D Transforms (zero dependências extras)
**Tempo estimado:** 15-30 minutos
**Resultado:** Componente carrossel 3D completo, responsivo, com links clicáveis

## Inputs

O usuário deve fornecer:

| Input | Obrigatório | Exemplo |
|-------|-------------|---------|
| Lista de items (título, imagem, link) | Sim | Array de objetos com dados dos cards |
| Número de cards | Não (detectado do array) | 6-12 cards |
| Raio do círculo | Não (default: calculado) | 400px |
| Perspectiva | Não (default: 1200px) | 800px-2000px |
| Auto-rotação | Não (default: true) | true/false |
| Velocidade de auto-rotação | Não (default: 0.3 deg/frame) | 0.1-1.0 |
| Estilo dos cards | Não (default: glassmorphism) | "glass", "solid", "minimal" |

## Processo

### Fase 1 — Estrutura de Arquivos

```
src/
  components/
    Carousel3D.tsx             # Componente principal
    Carousel3DCard.tsx         # Card individual
  hooks/
    useCarousel3D.ts           # Lógica de rotação, drag, scroll
  types/
    carousel.ts                # Tipos TypeScript
```

### Fase 2 — Tipos

```typescript
// src/types/carousel.ts
export interface CarouselItem {
  id: string | number;
  title: string;
  subtitle?: string;
  image?: string;
  href?: string;
  gradient?: string;  // CSS gradient para fallback sem imagem
}

export interface Carousel3DConfig {
  items: CarouselItem[];
  radius?: number;           // translateZ em px (default: calculado)
  perspective?: number;      // perspectiva em px (default: 1200)
  autoRotate?: boolean;      // auto-rotação (default: true)
  autoRotateSpeed?: number;  // graus por frame (default: 0.3)
  dragSensitivity?: number;  // sensibilidade do drag (default: 0.3)
  scrollSensitivity?: number; // sensibilidade do scroll (default: 0.5)
}
```

### Fase 3 — Hook useCarousel3D (núcleo da lógica)

Este hook encapsula toda a lógica de interação. As decisões críticas:

1. **Drag horizontal** com `touch-action: pan-y` para não bloquear scroll vertical
2. **Prevenção de swipe back** do browser via `overscroll-behavior-x: none`
3. **Click vs drag** com threshold de 5px de movimento
4. **Auto-rotação** para quando o usuário interage, retoma após 3s

```typescript
// src/hooks/useCarousel3D.ts
import { useRef, useState, useCallback, useEffect } from "react";

interface UseCarousel3DOptions {
  itemCount: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  dragSensitivity?: number;
  scrollSensitivity?: number;
}

export function useCarousel3D({
  itemCount,
  autoRotate = true,
  autoRotateSpeed = 0.3,
  dragSensitivity = 0.3,
  scrollSensitivity = 0.5,
}: UseCarousel3DOptions) {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartRotation = useRef(0);
  const totalDragDistance = useRef(0);
  const autoRotateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<number | null>(null);
  const isUserInteracting = useRef(false);

  // --- AUTO-ROTAÇÃO ---
  useEffect(() => {
    if (!autoRotate) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      if (!isUserInteracting.current) {
        const delta = (time - lastTime) / 16; // Normalizar para ~60fps
        setRotation((prev) => prev + autoRotateSpeed * delta);
      }
      lastTime = time;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [autoRotate, autoRotateSpeed]);

  // Função para pausar auto-rotação temporariamente
  const pauseAutoRotate = useCallback(() => {
    isUserInteracting.current = true;
    if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
    autoRotateTimer.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 3000); // Retoma após 3 segundos
  }, []);

  // --- DRAG (mouse + touch) ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      setDragMoved(false);
      totalDragDistance.current = 0;
      dragStartX.current = e.clientX;
      dragStartRotation.current = rotation;
      pauseAutoRotate();

      // Capturar pointer para receber eventos fora do elemento
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [rotation, pauseAutoRotate]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartX.current;
      totalDragDistance.current = Math.abs(deltaX);

      // Marcar como "moveu" se ultrapassar threshold de 5px
      if (totalDragDistance.current > 5) {
        setDragMoved(true);
      }

      const newRotation = dragStartRotation.current + deltaX * dragSensitivity;
      setRotation(newRotation);
    },
    [isDragging, dragSensitivity]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    // dragMoved permanece true até o próximo pointerDown
    // para que o click handler possa checar
  }, []);

  // --- SCROLL WHEEL ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Só capturar scroll horizontal ou com shift
      // Para não bloquear scroll vertical da página
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault();
        const delta = (e.deltaX || e.deltaY) * scrollSensitivity;
        setRotation((prev) => prev + delta);
        pauseAutoRotate();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scrollSensitivity, pauseAutoRotate]);

  // --- CLICK PROTECTION ---
  // Retorna true se o click deve ser bloqueado (houve drag)
  const shouldBlockClick = useCallback(() => {
    return dragMoved;
  }, [dragMoved]);

  // Ângulo por item (distribuição uniforme no círculo)
  const anglePerItem = 360 / itemCount;

  return {
    containerRef,
    rotation,
    isDragging,
    anglePerItem,
    shouldBlockClick,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  };
}
```

### Fase 4 — Carousel3DCard

```typescript
// src/components/Carousel3DCard.tsx
import { type CarouselItem } from "../types/carousel";

interface Carousel3DCardProps {
  item: CarouselItem;
  angle: number;        // Ângulo deste card no círculo
  rotation: number;     // Rotação atual do carrossel
  radius: number;       // translateZ
  shouldBlockClick: () => boolean;
}

export function Carousel3DCard({
  item,
  angle,
  rotation,
  radius,
  shouldBlockClick,
}: Carousel3DCardProps) {
  // Calcular ângulo absoluto do card considerando a rotação
  const totalAngle = angle + rotation;

  // Normalizar para -180 a 180 para calcular opacidade
  const normalizedAngle = ((totalAngle % 360) + 540) % 360 - 180;
  const absAngle = Math.abs(normalizedAngle);

  // Cards atrás (ângulo > 90) ficam mais transparentes
  const opacity = absAngle > 120 ? 0.2 : absAngle > 90 ? 0.4 : 1;
  const pointerEvents = absAngle > 120 ? "none" : "auto";

  const handleClick = (e: React.MouseEvent) => {
    if (shouldBlockClick()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Se tem href, navegação acontece normalmente via tag <a>
  };

  const cardContent = (
    <div
      className="w-[280px] h-[360px] rounded-2xl overflow-hidden
                 backdrop-blur-md border border-white/10
                 flex flex-col items-center justify-center gap-4 p-6
                 transition-opacity duration-300 cursor-pointer
                 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10"
      style={{
        background: item.gradient || "rgba(255, 255, 255, 0.05)",
        opacity,
        pointerEvents: pointerEvents as React.CSSProperties["pointerEvents"],
      }}
    >
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className="w-32 h-32 object-contain"
          draggable={false}
        />
      )}
      <h3 className="text-xl font-bold text-white text-center">
        {item.title}
      </h3>
      {item.subtitle && (
        <p className="text-sm text-white/50 text-center">{item.subtitle}</p>
      )}
    </div>
  );

  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
    transformStyle: "preserve-3d",
  };

  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        style={wrapperStyle}
        onClick={handleClick}
        draggable={false}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div style={wrapperStyle} onClick={handleClick}>
      {cardContent}
    </div>
  );
}
```

### Fase 5 — Carousel3D (componente principal)

```typescript
// src/components/Carousel3D.tsx
import { Carousel3DCard } from "./Carousel3DCard";
import { useCarousel3D } from "../hooks/useCarousel3D";
import { type Carousel3DConfig } from "../types/carousel";

export function Carousel3D({
  items,
  radius: customRadius,
  perspective = 1200,
  autoRotate = true,
  autoRotateSpeed = 0.3,
  dragSensitivity = 0.3,
  scrollSensitivity = 0.5,
}: Carousel3DConfig) {
  const {
    containerRef,
    rotation,
    isDragging,
    anglePerItem,
    shouldBlockClick,
    handlers,
  } = useCarousel3D({
    itemCount: items.length,
    autoRotate,
    autoRotateSpeed,
    dragSensitivity,
    scrollSensitivity,
  });

  // Calcular raio automaticamente se não fornecido
  // Fórmula: circumferência = N * cardWidth → raio = (N * cardWidth) / (2 * PI)
  const cardWidth = 280;
  const defaultRadius = Math.max(
    (items.length * (cardWidth + 40)) / (2 * Math.PI),
    300
  );
  const radius = customRadius || defaultRadius;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        // Prevenir gesto "swipe back" do browser
        overscrollBehaviorX: "none",
        touchAction: "pan-y",  // Permitir scroll vertical, bloquear horizontal
      }}
    >
      {/* Fade nas bordas */}
      <div
        className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, var(--color-bg, #030014), transparent)",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, var(--color-bg, #030014), transparent)",
        }}
      />

      {/* Container do carrossel */}
      <div
        ref={containerRef}
        className="flex items-center justify-center py-16"
        style={{
          perspective: `${perspective}px`,
          cursor: isDragging ? "grabbing" : "grab",
          minHeight: "500px",
        }}
        {...handlers}
      >
        {/* Anel rotativo */}
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${rotation}deg)`,
            width: "280px",
            height: "360px",
            position: "relative",
          }}
        >
          {items.map((item, index) => (
            <Carousel3DCard
              key={item.id}
              item={item}
              angle={index * anglePerItem}
              rotation={rotation}
              radius={radius}
              shouldBlockClick={shouldBlockClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Fase 6 — Exemplo de Uso

```typescript
// Exemplo de integração em qualquer página
import { Carousel3D } from "./components/Carousel3D";

const items = [
  {
    id: 1,
    title: "IA para Marketing",
    subtitle: "Automatize suas campanhas",
    href: "https://example.com/marketing",
    gradient: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1))",
  },
  {
    id: 2,
    title: "IA para Vendas",
    subtitle: "SDR inteligente 24/7",
    href: "https://example.com/vendas",
    gradient: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(139,92,246,0.1))",
  },
  {
    id: 3,
    title: "IA para Atendimento",
    subtitle: "WhatsApp Bot com IA",
    href: "https://example.com/atendimento",
    gradient: "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(59,130,246,0.1))",
  },
  // ... mais items
];

function App() {
  return (
    <div style={{ background: "#030014", minHeight: "100vh" }}>
      <h2 className="text-center text-3xl font-bold text-white pt-20 mb-4">
        Nossas Soluções
      </h2>
      <Carousel3D
        items={items}
        autoRotate={true}
        autoRotateSpeed={0.2}
        perspective={1200}
      />
    </div>
  );
}
```

### Fase 7 — Responsividade

O carrossel precisa de ajustes para mobile:

```typescript
// Adicionar ao Carousel3D.tsx — calcular raio responsivo
const getResponsiveRadius = (itemCount: number): number => {
  const width = typeof window !== "undefined" ? window.innerWidth : 1024;

  if (width < 640) {
    // Mobile: raio menor, cards mais próximos
    return Math.max((itemCount * 200) / (2 * Math.PI), 200);
  }
  if (width < 1024) {
    // Tablet: raio médio
    return Math.max((itemCount * 240) / (2 * Math.PI), 250);
  }
  // Desktop: raio padrão
  return Math.max((itemCount * 320) / (2 * Math.PI), 300);
};

// Cards menores em mobile:
// Trocar w-[280px] h-[360px] por:
// className="w-[clamp(200px,60vw,280px)] h-[clamp(260px,70vw,360px)]"
```

### Fase 8 — Checklist de Qualidade

Antes de considerar o carrossel pronto, validar:

- [ ] Cards estão dispostos em círculo (visualmente correto em 3D)
- [ ] Drag horizontal gira o carrossel suavemente
- [ ] Scroll wheel gira o carrossel (shift+scroll ou scroll horizontal)
- [ ] Auto-rotação funciona e pausa ao interagir
- [ ] Auto-rotação retoma após 3s sem interação
- [ ] Click em card com link navega corretamente
- [ ] Click NÃO dispara após drag (proteção funciona)
- [ ] Swipe back do browser NÃO é acionado (overscroll-behavior)
- [ ] Fade nas bordas laterais está visível
- [ ] Cards atrás (ângulo > 90deg) ficam transparentes
- [ ] Funciona em mobile (touch drag)
- [ ] Scroll vertical da página não é bloqueado (touch-action: pan-y)
- [ ] Sem layout shift ao carregar

### Decisões de Design Documentadas

| Decisão | Justificativa |
|---------|---------------|
| CSS 3D Transforms puro | Zero dependências, performance nativa, GPU-accelerated |
| `rotateY` + `translateZ` | Método padrão para posicionar items em círculo 3D |
| `setPointerCapture` | Garante que eventos de drag continuem mesmo fora do elemento |
| Threshold de 5px para drag vs click | Abaixo disso é tremor natural da mão, acima é intenção de arrastar |
| `overscroll-behavior-x: none` | Previne gesto "swipe back" nativo dos browsers |
| `touch-action: pan-y` | Permite scroll vertical normal, captura apenas horizontal |
| Opacidade por ângulo | Cards atrás ficam sutis, reforçando a sensação 3D |
| Raio calculado automaticamente | `N * cardWidth / (2 * PI)` garante que cards não se sobreponham |
| Auto-rotação com `requestAnimationFrame` | Suave, sincronizada com refresh rate, sem jank |
| Pausa de 3s após interação | Tempo suficiente para o usuário terminar, não longo demais |

### Armadilhas Conhecidas (e como evitar)

| Problema | Causa | Solução |
|----------|-------|---------|
| Cards piscando no Safari | `backface-visibility` | Adicionar `backface-visibility: hidden` aos cards |
| Drag dispara click | Sem threshold | Usar `dragMoved` com threshold de 5px |
| Browser volta página no swipe | `overscroll-behavior` ausente | Adicionar `overscroll-behavior-x: none` |
| Scroll vertical travado | `touch-action: none` | Usar `touch-action: pan-y` (só bloqueia horizontal) |
| Carrossel some em mobile | Raio muito grande | Calcular raio responsivo baseado em `window.innerWidth` |
| Performance ruim com muitos cards | DOM pesado | Limitar a 12 cards visíveis; acima, considerar virtualização |

## Output

A skill entrega:

1. **Componente Carousel3D** completo com drag, scroll e auto-rotação
2. **Hook useCarousel3D** reutilizável com toda a lógica encapsulada
3. **Cards clicáveis** com proteção contra click acidental
4. **Zero dependências** além do React
5. **Responsivo** com raio adaptativo por breakpoint
6. **Configurável** via props (raio, perspectiva, velocidade, sensibilidade)

## Variantes

### Glassmorphism (padrão)
- Cards com `backdrop-blur-md` e border translúcido
- Ideal para: temas escuros, estilo premium

### Solid
- Cards com background sólido e sombra
- Trocar: `backdrop-blur-md` por `bg-gray-800` e `shadow-xl`
- Ideal para: temas claros ou quando blur causa lag em mobile

### Minimal
- Cards sem borda, apenas conteúdo
- Trocar: remover border e backdrop, manter apenas conteúdo com opacidade
- Ideal para: galerias de imagens onde o card é a própria imagem

### Com Navegação por Botões
- Adicionar setas laterais que giram N graus por click
- Implementação: `setRotation(prev => prev + anglePerItem)` no click
