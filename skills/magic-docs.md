---
name: magic-docs
description: "Documentação viva que se autoatualiza — gera e mantém docs do projeto, ofertas, processos e decisões sincronizados com o estado real do negócio."
tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# /magic-docs — Documentação Viva

> **Tipo:** Skill de manutenção | **Agente padrão:** @aios-master
> **Trigger:** Após mudanças significativas, ou semanalmente via /weekly-sync
> **Output:** Documentos atualizados em ~/docs/

## Objetivo

Manter documentação sempre sincronizada com a realidade. Quando uma oferta muda, o doc atualiza. Quando uma campanha encerra, o debriefing é gerado. Quando um processo evolui, o playbook reflete.

---

## Documentos Gerenciados

### 1. Estado do Negócio (`~/docs/business-state.md`)
Atualizado semanalmente:
- Produtos ativos e preços
- Campanhas rodando e métricas
- Próximos eventos/lançamentos
- Equipe e ferramentas

### 2. Playbook de Lançamento (`~/docs/launch-playbook.md`)
Atualizado após cada lançamento:
- Checklist validado (o que funcionou)
- Anti-checklist (o que não funcionou)
- Métricas reais vs projeções
- Aprendizados para o próximo

### 3. Mapa de Ofertas (`~/docs/offers-map.md`)
Atualizado quando oferta muda:
- Stack de cada produto
- Preços e condições
- Taxas de conversão reais
- Objeções mais comuns e respostas

### 4. Decisões Log (`~/docs/decisions-log.md`)
Atualizado em tempo real:
- Decisão tomada, data, contexto
- Resultado (se já conhecido)
- Quem decidiu (CEO vs agente)

## Processo de Atualização

### Auto-trigger (quando detecta mudança)
```
Se results.json mudou significativamente → atualizar business-state
Se oferta nova/alterada → atualizar offers-map
Se lançamento encerrou → gerar debriefing no playbook
Se decisão importante tomada → registrar no decisions-log
```

### Manual (/magic-docs)
```
1. Ler todos os docs gerenciados
2. Comparar com estado atual (results.json, memórias, arquivos)
3. Identificar desatualizado
4. Atualizar com dados reais
5. Marcar data de atualização
```

## Regras
- Docs SEMPRE refletem realidade (nunca aspiracional)
- Toda métrica com data de quando foi medida
- Histórico preservado (não sobrescrever, adicionar)
- Formato consistente entre documentos
