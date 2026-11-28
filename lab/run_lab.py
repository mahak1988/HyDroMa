"""Lab CLI: run all pilots through the model battery and write a JSON report.

Usage:  python lab/run_lab.py
Exit code 0 = all checks passed; 1 = failures (see report).
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from harness import run_all  # noqa: E402


def main() -> int:
    report = run_all()
    report["generated_at"] = datetime.now(timezone.utc).isoformat()
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "lab_report.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, sort_keys=True)

    print(f"Pilots: {', '.join(report['pilots'])}")
    print(f"Battery ({len(report['battery'])} models): {', '.join(report['battery'])}")
    for pid in report["pilots"]:
        r = report["results"][pid]
        ok = sum(1 for m in report["battery"] if r.get(m, {}).get("ok"))
        ar = (r.get("aridity", {}).get("result") or {}).get("class")
        gdd = (r.get("crop_dssat", {}).get("result") or {}).get("total_gdd")
        print(f"  [{pid:12}] models_ok={ok}/{len(report['battery'])} aridity={ar} gdd={gdd}")
    print(f"Report: {out_path}")
    if report["passed"]:
        print("RESULT: PASS")
        return 0
    print("RESULT: FAIL")
    for f in report["failures"]:
        print("  -", f)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())