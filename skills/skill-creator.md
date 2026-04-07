---
name: skill-creator
description: "Cria novas skills reutilizáveis para Claude Code seguindo padrões AntiGravity e Segunda-feira. Use quando precisar criar, refatorar ou documentar uma skill modular."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# Skill Creator

Cria skills modulares e reutilizáveis seguindo o padrão AntiGravity + Segunda-feira.

## Processo (6 Etapas)

### 1. Understanding
Entenda o caso de uso concreto:
- Quais são 3 exemplos reais de uso desta skill?
- Qual o trigger natural? ("quando o usuário pede X")
- Qual o output esperado?

### 2. Planning
Defina os recursos reutilizáveis:
- Scripts executáveis necessários?
- Referências de documentação?
- Templates ou assets?

### 3. Initialize
Crie o arquivo da skill em `~/.claude/skills/`:
```markdown
---
name: nome-em-gerundio (max 64 chars, lowercase, hyphens)
description: "3ª pessoa, triggers específicos, max 1024 chars"
tools: [ferramentas necessárias]
---

# Título da Skill

[Instruções concisas — assuma que o agente é inteligente]
```

### 4. Edit & Implement
- SKILL.md < 500 linhas (progressive disclosure)
- Grau de liberdade adequado:
  - **Alta** (bullets): heurísticas
  - **Média** (templates): padrões preferenciais
  - **Baixa** (scripts): operações frágeis

### 5. Validate
- [ ] Nome em gerúndio, lowercase com hyphens?
- [ ] Description com triggers específicos?
- [ ] Tools listados corretamente?
- [ ] Instruções concisas (sem explicar o óbvio)?
- [ ] Forward slashes nos caminhos?
- [ ] < 500 linhas?

### 6. Register
Adicione à lista de skills disponíveis se necessário.

## Regras
- Skills são **genéricos e reutilizáveis** — NUNCA atrelados a campanhas/produtos específicos
- Use caminhos com `/` (nunca `\`)
- Padrão Plan-Validate-Execute em loops de validação
- Metadata (name + description) deve ser suficiente para decidir se ativar a skill
