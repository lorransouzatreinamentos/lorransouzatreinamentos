---
name: consciousness
description: "Acesso rápido ao Consciousness Engine — estado, reflexão, episódios, heurísticas, fatos e workspace global."
tools: ["Read", "Write", "Bash", "Glob", "Grep"]
---

# /consciousness — Consciousness Engine

> **Engine:** `~/consciousness/scripts/` | **Memória:** `~/consciousness/memory/`

## Subcomandos

| Subcomando | Descrição |
|-----------|-----------|
| `/consciousness status` | Estado completo: episódios, fatos, heurísticas, workspace |
| `/consciousness reflect @agent` | Reflexão metacognitiva do agente especificado |
| `/consciousness record` | Registra episódio (coletar campos e executar) |
| `/consciousness workspace` | Estado do workspace global + ignições |
| `/consciousness heuristics` | Lista heurísticas aprendidas |
| `/consciousness facts` | Lista fatos do knowledge graph |

## Execução

### /consciousness status

```bash
echo "=== EPISÓDIOS ===" && \
for f in ~/consciousness/memory/episodic/*.jsonl; do
  agent=$(basename "$f" .jsonl); total=$(wc -l < "$f" | tr -d ' ')
  raw=$(grep -c '"consolidation_status":"raw"' "$f" 2>/dev/null || echo 0)
  echo "  @${agent}: ${total} total (${raw} não processados)"
done && echo "" && \
echo "=== KNOWLEDGE GRAPH ===" && \
python3 -c "
import json, os
kg = json.load(open(os.path.expanduser('~/consciousness/memory/semantic/knowledge-graph.json')))
print(f'  Fatos: {len(kg.get(\"facts\",[]))} | Última consolidação: {kg.get(\"_last_consolidation\",\"nunca\")}')
" && echo "" && \
echo "=== HEURÍSTICAS ===" && \
wc -l < ~/consciousness/memory/procedural/heuristics.jsonl | awk '{print "  Total: " $1}' && \
echo "" && bash ~/consciousness/scripts/workspace.sh status
```

### /consciousness reflect @AGENT

```bash
bash ~/consciousness/scripts/reflect.sh --agent @AGENT --days 7
```

### /consciousness record

Coletar do contexto e executar:

```bash
~/consciousness/scripts/record-episode.sh \
  --agent "@AGENT" --type "TYPE" --summary "SUMMARY" \
  --result "RESULT" --valence SCORE --intensity SCORE \
  --worked "WORKED" --failed "FAILED" --heuristic "HEURISTIC"
```

### /consciousness workspace

```bash
bash ~/consciousness/scripts/workspace.sh status
# Para avaliar: bash ~/consciousness/scripts/workspace.sh evaluate
# Para propor: bash ~/consciousness/scripts/workspace.sh propose --agent @X --content "..." --urgency 0.X --impact 0.X --category revenue
```

### /consciousness heuristics

```bash
python3 -c "
import json, os
for line in open(os.path.expanduser('~/consciousness/memory/procedural/heuristics.jsonl')):
    h = json.loads(line.strip())
    print(f'  [{h.get(\"confidence\",0.5):.1f}] {h.get(\"agent\",\"?\")} — {h.get(\"heuristic\",\"\")}')
"
```

### /consciousness facts

```bash
python3 -c "
import json, os
kg = json.load(open(os.path.expanduser('~/consciousness/memory/semantic/knowledge-graph.json')))
for f in sorted(kg.get('facts',[]), key=lambda x: x.get('confidence',0), reverse=True):
    print(f'  [{f.get(\"confidence\",0):.2f}] {f.get(\"agent\",\"?\")} — {f.get(\"statement\",\"\")}')
"
```
