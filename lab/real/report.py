"""Report builder: Markdown + JSON (lab-only, stdlib)."""

from __future__ import annotations

import json
from typing import Any, Dict

__all__ = ["build_markdown", "build_json"]


def build_json(results: Dict[str, Any]) -> Dict[str, Any]:
    return results


def build_markdown(r: Dict[str, Any]) -> str:
    L = []
    L.append("# HyDroMA Scientific Benchmark Report")
    L.append("")
    L.append(f"- Generated: {r.get('generated_at')}")
    L.append(f"- Data: {r.get('data', {}).get('source')} ({r.get('data', {}).get('kind')})")
    L.append(f"- Classification: {r.get('classification')}")
    L.append("")
    L.append("## 1. Model inventory")
    for m in r["inventory"]:
        L.append(f"- `{m['model_id']}` — {m['family']} — {m['file']} — maturity {m['maturity']}")
    L.append("")
    L.append("## 2. Dataset quality")
    q = r["quality"]
    L.append(f"- ok={q['ok']} n={q.get('n')} errors={len(q['errors'])} warnings={len(q['warnings'])}")
    for e in q["errors"][:10]:
        L.append(f"  - E: {e}")
    L.append("")
    L.append("## 3. Reference cross-check (FAO-56 vs independent reimplementation)")
    ev = r["reference_evaluation"]
    L.append(f"- NSE={ev.get('nse')} RMSE={ev.get('rmse')} MAE={ev.get('mae')} Bias={ev.get('bias')}")
    L.append("")
    L.append("## 4. Stress tests")
    for s in r["stress"]:
        L.append(f"- {s['id']}: expect={s['expect']} -> {s['class']} (ok={s['ok']})")
    L.append("")
    L.append("## 5. Sensitivity (OAT on FAO-56 ET0)")
    for s in r["sensitivity"]:
        L.append(f"- {s['param']} Δ{s['delta']}: out={s['output']} rel={s['rel_change_pct']}%")
    L.append("")
    L.append("## 6. Cross-model consistency")
    for c in r["consistency"]:
        L.append(f"- {c['check']}: {c['status']}")
    L.append("")
    L.append("## 7. Defect register")
    for f in r["findings"]:
        L.append(f"- [{f['severity']}] {f['id']} ({f['category']}) {f['model_id']}: {f['summary']}")
    L.append("")
    L.append("## 8. Model assessment")
    for a in r["assessments"]:
        L.append(f"- {a['model_id']}: {a['status']}")
    L.append("")
    L.append("## 9. Limitations")
    for x in r["limitations"]:
        L.append(f"- {x}")
    L.append("")
    L.append("## 10. Independent review")
    L.append(f"- {r['review']['status']}")
    return "\n".join(L)