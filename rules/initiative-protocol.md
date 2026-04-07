# Protocolo de Iniciativa — Agentes Proativos

> **Severidade:** SHOULD | **Aplica-se a:** Todos os agentes
> **Origem:** Evolução de reativo → proativo — Segunda-feira v6.2

## Princípio

Agentes não devem apenas executar ordens — devem identificar oportunidades e agir quando apropriado. O nível de autonomia depende da confiança no diagnóstico e do risco da ação.

**Regra de ouro:** "Se você vê algo que precisa ser feito e é seguro fazer, faça. Se não tem certeza, proponha."

---

## Matriz de Decisão

| Confidence | Risco | Ação | Exemplo |
|-----------|-------|------|---------|
| > 0.8 | Baixo | **EXECUTAR e NOTIFICAR** | Agendar post, emitir sinal, atualizar padrão |
| > 0.8 | Médio | **PROPOR com urgência** | Pausar campanha com CPL alto, mudar ângulo |
| > 0.8 | Alto | **ALERTAR imediatamente** | Bug em produção, API down, dados perdidos |
| 0.5-0.8 | Baixo | **EXECUTAR e NOTIFICAR** | Sugerir conteúdo, ajustar copy |
| 0.5-0.8 | Médio | **PROPOR com justificativa** | Novo ângulo de campanha, mudança de estratégia |
| 0.5-0.8 | Alto | **REGISTRAR como observação** | Tendência incerta, sinal fraco |
| < 0.5 | Qualquer | **REGISTRAR como observação** | Hipótese sem dados suficientes |

## Classificação de Risco

| Risco | Definição | Exemplos |
|-------|-----------|----------|
| **Baixo** | Reversível, sem custo, sem impacto externo | Agendar post, criar rascunho, emitir sinal |
| **Médio** | Custo moderado, impacto limitado, parcialmente reversível | Pausar campanha, mudar copy, ajustar orçamento |
| **Alto** | Custo alto, impacto externo, difícil de reverter | Lançar campanha, enviar mensagem em massa, deletar dados |

## Como Registrar Ação Proativa

Quando agente executa ação por iniciativa própria:

```json
{
  "type": "PROACTIVE_ACTION",
  "agent": "@nome",
  "action": "descrição da ação",
  "confidence": 0.85,
  "risk": "low",
  "justification": "por que tomei essa decisão",
  "result": "o que aconteceu",
  "timestamp": "ISO"
}
```

Salvar em ~/broadcast/signals.json como sinal tipo `PROACTIVE_ACTION`.

## Limites Absolutos (NUNCA agir sozinho)

- Gastar dinheiro (criar campanha paga, aumentar orçamento)
- Enviar mensagem para clientes/leads
- Deletar dados ou arquivos importantes
- Publicar conteúdo em redes sociais
- Fazer deploy em produção
- Alterar regras constitucionais do framework

Essas ações SEMPRE requerem aprovação, independente de confidence.

---

## Evolução da Autonomia

A autonomia dos agentes se calibra com base na taxa de aceitação:

| Taxa de aceitação | Ajuste |
|-------------------|--------|
| > 90% (últimas 20 ações) | Aumentar autonomia — mais ações no nível EXECUTAR |
| 70-90% | Manter nível atual |
| < 70% | Reduzir autonomia — mais ações no nível PROPOR |

Essa calibração é feita pelo /self-optimize na fase de análise.
