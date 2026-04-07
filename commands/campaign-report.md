---
description: "Gera relatório completo de campanha Meta Ads com análise Sobral/Hormozi e recomendações"
argument-hint: "[campaign-id ou 'all']"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "Agent"]
---

# Relatório de Campanha Meta Ads

Gere um relatório completo de performance de campanha Meta Ads para o argumento: $ARGUMENTS

## Instruções de Execução

### Passo 1: Coleta de Dados
- Leia a memória do projeto em `~/.claude/projects/${USER_PROJECT_PATH}/memory/desafio-mi-v4.md` e `~/.claude/projects/${USER_PROJECT_PATH}/memory/MEMORY.md` para contexto das campanhas ativas
- Se um campaign-id específico foi fornecido, foque nessa campanha
- Se 'all' foi passado, analise todas as campanhas ativas
- Colete: CPL, CTR, frequência, alcance, conversões, gasto, período, criativos ativos

### Passo 2: Análise de Métricas Core
Para cada campanha/conjunto, analise:
- **CPL** (Custo por Lead): vs meta de R$5,00
- **CTR** (Click-Through Rate): benchmark >1.5% para cold traffic
- **Frequência**: alerta se >2.5 (fadiga criativa)
- **Alcance vs Impressões**: ratio de saturação
- **Taxa de Conversão LP**: leads/cliques
- **Gasto vs Budget**: pacing (está gastando rápido demais ou devagar?)

### Passo 3: Matriz de Decisão Sobral
Aplique as regras do Pedro Sobral para cada conjunto:
- **ESCALAR** (CPL < meta e volume consistente): duplicar campanha inteira (NÃO aumentar orçamento)
- **MANTER** (CPL próximo da meta, tendência estável): não mexer, monitorar
- **PAUSAR** (CPL > 2x meta por 3+ dias): pausar imediatamente
- **DUPLICAR** (CPL bom mas volume baixo): criar cópia da campanha
- Regra: duplicação > aumento de orçamento (aumento de budget piora CPL)
- Nota da conta (1-10): baseado em estabilidade e histórico

### Passo 4: Lente Hormozi
Aplique a análise Alex Hormozi:
- **Valor da Oferta**: o lead está recebendo valor suficiente para converter?
- **Qualidade do Lead**: CPL baixo mas lead qualificado? Ou lead lixo barato?
- **LTV projetado**: baseado na oferta backend, qual o valor máximo aceitável por lead?
- **Escala vs Eficiência**: estamos otimizando para o metric certo?

### Passo 5: Lente Motion (Criativo)
Aplique análise de criativos:
- **Fadiga criativa**: frequência alta + CTR caindo = criativo cansado
- **Diversidade de ângulos**: quantos ângulos diferentes estão rodando?
- **Win rate**: % de criativos com CPL abaixo da meta
- **Teste de novos**: há criativos em teste? Volume suficiente para validar?
- **Formato**: mix de estáticos vs vídeo vs carrossel

### Passo 6: Relatório Estruturado
Gere o relatório em português com esta estrutura:

```markdown
# Relatório de Campanha — [Nome] — [Data]

## Resumo Executivo
- Gasto total: R$ X
- Leads captados: X
- CPL médio: R$ X
- Meta CPL: R$ 5,00
- Status: [NO ALVO / ACIMA / ABAIXO]

## Performance por Campanha/Conjunto
| Campanha | Gasto | Leads | CPL | CTR | Freq | Decisão |
|----------|-------|-------|-----|-----|------|---------|

## Top 3 Criativos (por CPL)
1. [Nome/Ângulo] — CPL R$ X — CTR X%
2. ...
3. ...

## Análise Sobral
- Nota da conta: X/10
- Campanhas para ESCALAR: ...
- Campanhas para MANTER: ...
- Campanhas para PAUSAR: ...
- Campanhas para DUPLICAR: ...

## Análise Hormozi
- Valor percebido da oferta: X/10
- Qualidade estimada dos leads: X/10
- CPL máximo aceitável: R$ X

## Análise de Criativos (Motion)
- Criativos ativos: X
- Criativos fatigados: X
- Ângulos em teste: X
- Recomendação: [novos ângulos / escalar existentes / pausar fatigados]

## Ações Recomendadas (próximas 24-48h)
1. [ ] Ação 1
2. [ ] Ação 2
3. [ ] Ação 3

## Projeção
- Leads estimados até fim da captação: X
- Budget restante: R$ X
- CPL projetado: R$ X
```

### Passo 7: Output
- Exiba o relatório completo no chat
- Se solicitado, salve em `~/reports/{date}-campaign-report.md`
