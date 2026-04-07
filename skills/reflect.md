---
name: reflect
description: "Reflexão metacognitiva rápida — wrapper para ~/consciousness/scripts/reflect.sh. Use /reflect @agente."
tools: ["Bash"]
---

# /reflect — Reflexão Metacognitiva (Atalho)

> **Equivale a:** `/consciousness reflect @agente`

## Uso

```
/reflect @dev
/reflect @traffic
/reflect @analyst --days 14
```

## Execução

Ao receber `/reflect @AGENT [--days N]`, executar:

```bash
bash ~/consciousness/scripts/reflect.sh --agent @AGENT [--days N]
```

O script analisa episódios recentes e produz: taxa de sucesso, valência média, pontos fortes/fracos, heurísticas ativas, recomendação.
