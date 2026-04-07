#!/usr/bin/env python3
"""
reflect.py — Motor de reflexão metacognitiva
Parte da Camada 2: Metacognição (Consciousness Engine)
"""

import json
import sys
import os
from datetime import datetime, timedelta, timezone
from collections import Counter

def reflect(agent, days=7):
    home = os.path.expanduser("~")
    episode_file = f"{home}/consciousness/memory/episodic/{agent}.jsonl"
    reflection_dir = f"{home}/consciousness/metacognition/reflections"
    os.makedirs(reflection_dir, exist_ok=True)

    if not os.path.exists(episode_file):
        print(f"Nenhum episódio encontrado para @{agent}")
        return

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    episodes = []
    with open(episode_file, 'r') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ep = json.loads(line)
                episodes.append(ep)
            except:
                pass

    if not episodes:
        print(f"Nenhum episódio nos últimos {days} dias para @{agent}")
        return

    # Análise
    successes = [e for e in episodes if e.get('outcome', {}).get('result') == 'success']
    failures = [e for e in episodes if e.get('outcome', {}).get('result') == 'failure']
    partials = [e for e in episodes if e.get('outcome', {}).get('result') == 'partial']

    valences = [e.get('valence', {}).get('score', 0) for e in episodes]
    avg_valence = sum(valences) / len(valences) if valences else 0

    what_worked = [e.get('lessons', {}).get('what_worked', '') for e in episodes if e.get('lessons', {}).get('what_worked')]
    what_failed = [e.get('lessons', {}).get('what_failed', '') for e in episodes if e.get('lessons', {}).get('what_failed')]
    heuristics = [e.get('lessons', {}).get('heuristic', '') for e in episodes if e.get('lessons', {}).get('heuristic')]
    task_types = Counter(e.get('type', 'unknown') for e in episodes)

    emotional = "positivo" if avg_valence > 0.2 else ("negativo" if avg_valence < -0.2 else "neutro")
    success_rate = round(len(successes) / len(episodes) * 100, 1) if episodes else 0

    # Recomendação
    if len(failures) > len(successes):
        rec = "Taxa de falha alta. Considerar: (1) mudar estratégia, (2) pedir ajuda, (3) dividir tarefas menores."
    elif avg_valence < -0.3:
        rec = "Valência negativa persistente. Revisar abordagem — padrões de frustração detectados."
    elif len(successes) > 0 and avg_valence > 0.3:
        rec = "Performance boa. Manter abordagem atual. Compartilhar heurísticas com outros agentes."
    else:
        rec = "Performance estável. Consolidar heurísticas que funcionaram."

    # Output terminal
    print(f"\n{'='*54}")
    print(f"  REFLEXÃO METACOGNITIVA — @{agent}")
    print(f"{'='*54}")
    print(f"Período: últimos {days} dias")
    print(f"Episódios: {len(episodes)} (sucesso:{len(successes)} falha:{len(failures)} parcial:{len(partials)})")
    print(f"Taxa de sucesso: {success_rate}%")
    print(f"Valência média: {round(avg_valence, 2)} ({emotional})")
    print()

    if what_worked:
        print("Pontos fortes:")
        for s in what_worked:
            print(f"  + {s}")
    if what_failed:
        print("Pontos fracos:")
        for w in what_failed:
            print(f"  - {w}")
    if heuristics:
        print("Heurísticas ativas:")
        for h in heuristics:
            print(f"  -> {h}")

    print(f"\nRecomendação: {rec}")
    print(f"{'='*54}")

    # Salvar
    reflection = {
        "agent": f"@{agent}",
        "period": f"últimos {days} dias",
        "generated": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "total_episodes": len(episodes),
            "successes": len(successes),
            "failures": len(failures),
            "partials": len(partials),
            "success_rate": success_rate,
            "avg_valence": round(avg_valence, 2),
            "task_types": dict(task_types)
        },
        "strengths": what_worked[:5],
        "weaknesses": what_failed[:5],
        "heuristics_active": heuristics[:5],
        "emotional_state": emotional,
        "recommendation": rec
    }

    date_str = datetime.now().strftime("%Y-%m-%d")
    filepath = f"{reflection_dir}/{agent}-{date_str}.json"
    with open(filepath, 'w') as f:
        json.dump(reflection, f, indent=2, ensure_ascii=False)

    print(f"\nSalvo em: {filepath}")
    return reflection


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Reflexão metacognitiva")
    parser.add_argument("--agent", required=True, help="Nome do agente (ex: dev, traffic)")
    parser.add_argument("--days", type=int, default=7, help="Período em dias")
    args = parser.parse_args()

    agent = args.agent.replace("@", "")
    reflect(agent, args.days)
