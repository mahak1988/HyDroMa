# Phase 3.88 — HyDroMA Runtime Recovery Assessment & Reproducibility Plan

**Classification:** `RUNTIME_RECOVERY_PLAN_READY_WITH_LIMITATIONS`
**Date:** 2026-11-26
**Repository:** `D:\NOJIN`
**Mode:** read-only assessment. No installs, repairs, downloads, env changes, or engine starts.

---

## 1. Executive summary

- Actual HyDroMA verification remains blocked: `engines/hydroma/.venv` is a 3.12.10 environment whose base interpreter (`C:\Users\hp\AppData\Local\Programs\Python\Python312\python.exe`) is missing; system Python is 3.15.2 without `fastapi`/`uvicorn`.
- `uv 0.13.4` is available; the launcher lists 3.15 (default) and a stale 3.12. No lockfile exists; dependencies are declared but unpinned.
- **Recommended runtime: Python 3.12** (matches `requires-python>=3.11`, CI `python-version: "3.12"`, and the venv’s intended version). 3.15 is not recommended (no deps, incompatible with 3.12 site-packages).
- A minimal, reproducible recovery plan is ready but **not executed**: rebuild an isolated 3.12 venv and install `engines/hydroma[api,test]` under owner authorization.
- **Nested repo discrepancy:** `D:\NOJIN\HyDroMa\` is absent; root `origin` still points to `HyDroMa.git`; no local metadata references the directory. The independent engine lives at `engines/hydroma` and is unaffected.
- **Port mismatch found:** engine `run_local` defaults to **8000**, gateway defaults to **8001**. Proposed startup must set `NOJIN_HYDROMA_URL` or run on 8001.
- No git mutations; production DB untouched.

---

## 2. Initial and final repository state

| Item | Initial | Final |
| --- | --- | --- |
| Branch | `main` | `main` |
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` | unchanged |
| Staged / Deleted | 0 / 0 | 0 / 0 |
| Modified tracked | 28 | 28 |
| Untracked collapsed | 141 | 141 (report only) |
| Production DB | mtime 04:55:35 | unchanged |
| Nested `HyDroMa/` | absent | absent |
| Python env | broken 3.12 venv; system 3.15 | unchanged |

No git mutations.

---

## 3. Python runtime inventory

| Runtime | Location | Version | Notes |
| --- | --- | --- | --- |
| System default | `…\Python\bin\python.exe` | 3.15.2 | no fastapi/uvicorn |
| Launcher 3.15 | `…\Python\pythoncore-3.15-64\python.exe` | 3.15 | default |
| Launcher 3.12 | `…\Programs\Python\Python312\python.exe` | **missing** | stale `py` entry |
| Astral/uv 3.15 | `…\uv\python\cpython-3.15.0…` | 3.15 | uv-managed |
| uv | `uv 0.13.4` | — | available |
| Venv | `engines/hydroma/.venv` | 3.12.10 | broken base |

No 3.11/3.13/3.14 runtime found.

---

## 4. Broken virtual environment analysis

- `pyvenv.cfg`: `version = 3.12.10`, `home/executable = …Python312\python.exe` (**missing**), `include-system-site-packages = false`.
- `Scripts/python.exe`, `pythonw.exe`, `uvicorn.exe` exist but fail with `No Python at …Python312`.
- `Lib/site-packages` contains fastapi 0.165.0, uvicorn, pydantic, etc. (3.12 artifacts).
- Metadata is internally consistent but **not recoverable without rebuilding**: the base interpreter is absent. Copying 3.12 packages to 3.15 is unsafe (ABI mismatch) and prohibited.
- No launcher was executed in a way that modifies files.

---

## 5. Dependency inventory

| Dependency | Declared | Installed (venv) | Required | Type |
| --- | --- | --- | --- | --- |
| fastapi | `api` extra (unpinned) | 0.165.0 | yes (API) | optional/api |
| uvicorn[standard] | `api` extra | present | yes (server) | optional/api |
| httpx | `api` + `test` | present | yes (test/client) | optional/test |
| pytest | `test` extra | present | yes (tests) | test-only |
| pydantic | transitive (fastapi) | present | transitive | transitive |
| setuptools>=68 | build-system | — | build | build |

- Core `dependencies = []`.
- **No lockfile** (`requirements*.txt`, `uv.lock`, `poetry.lock`, `Pipfile*` absent).
- CI: `pip install -e "engines/hydroma[api,test]"`, Python 3.12.
- Reproducibility: **moderate** — declared but unpinned and unlocked; versions may drift.

---

## 6. Python compatibility matrix

| Runtime | Project requirement | Dependencies | CI compatibility | Recommendation |
| --- | --- | --- | --- | --- |
| 3.11 | meets `>=3.11` | unpinned; unverified | not used | unverified |
| 3.12 | meets | venv intended; CI installs | **CI uses 3.12** | **recommended** |
| 3.13 | meets | unverified | not used | unverified |
| 3.14 | meets | unverified | not used | unverified |
| 3.15 | meets | not installed; 3.12 packages incompatible | not used | not recommended |

---

## 7. Runtime recommendation

Use an **isolated Python 3.12** environment (`engines/hydroma/.venv`) rebuilt from `pyproject.toml`, matching CI. Do not use 3.15. Do not reuse the broken venv.

---

## 8. Recovery options

| Option | Compatibility | Reproducibility | Cost | Risk to WIP/system | Maintainability | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Restore base 3.12 (owner install) | high | high | medium | low (system install) | high | preferred if owner authorizes |
| Rebuild venv via `uv venv --python 3.12` | high | high | low (uv may fetch 3.12) | low (isolated) | high | **recommended** |
| Reuse broken venv | none | none | none | none | low | rejected |
| 3.15 + install deps | unverified | medium | low | low | medium | not recommended |
| Copy 3.12 packages to 3.15 | unsafe | none | none | high | low | prohibited/rejected |

---

## 9. Proposed environment setup — `PROPOSED — NOT EXECUTED`

```bash
# Requires owner authorization; may download a 3.12 interpreter via uv.
uv venv --python 3.12 engines/hydroma/.venv
uv pip install -e "engines/hydroma[api,test]"
engines/hydroma/.venv/Scripts/python -m pytest engines/hydroma/tests
```

Alternative if a real 3.12 base is restored:

```bash
py -3.12 -m venv engines/hydroma/.venv
engines/hydroma/.venv/Scripts/python -m pip install -e "engines/hydroma[api,test]"
```

---

## 10. Proposed engine startup — `PROPOSED — NOT EXECUTED`

```bash
# Terminal A (engine, loopback). Port 8001 matches the gateway default.
engines/hydroma/.venv/Scripts/python -m hydroma.run_local --host 127.0.0.1 --port 8001

# Terminal B (API) with gateway pointed at the engine:
NOJIN_HYDROMA_URL=http://127.0.0.1:8001 pnpm run dev:api   # or the project's API start command

# Health / registry:
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8001/v1/models

# Shutdown: Ctrl+C in Terminal A.
```

Notes: engine default port is 8000; set `NOJIN_HYDROMA_URL` or use 8001. `HYDROMA_DB` defaults to `hydroma.db` (use a temp path for tests). No network exposure; loopback only.

---

## 11. Runtime reproducibility analysis

- Declared deps are unpinned and unlocked → not fully reproducible.
- CI pins Python 3.12 but not package versions.
- Recommendation: after recovery, generate a lockfile (owner-authorized) and pin CI/development versions. Not done here.

---

## 12. Nested repository discrepancy

- `D:\NOJIN\HyDroMa\` is **absent**; no differently named directory exists.
- Root `origin` = `https://github.com/mahak1988/HyDroMa.git`; no local branch/tag/ref references the directory.
- No documentation/config references a local `HyDroMa/` path (only the remote).
- Impact: **none on the independent engine**, which is `engines/hydroma` (present). Cause of absence not inferred; no action taken.

---

## 13. Actual-engine verification readiness checklist

- [ ] Runtime 3.12 available and healthy.
- [ ] Dependencies installed (`[api,test]`).
- [ ] Engine starts on loopback (8001).
- [ ] `/health` returns ok.
- [ ] `/v1/models` lists `eco-nojin.hydroma.irrigation-schedule@1.0.0`.
- [ ] Gateway `NOJIN_HYDROMA_URL` points to engine.
- [ ] Authenticated API irrigation run (write role, org).
- [ ] Actual engine execution and polling.
- [ ] Result normalization + persistence.
- [ ] Provenance persisted; API vs engine run id distinct.
- [ ] Idempotency (no second execution).
- [ ] Tenant isolation.
- [ ] Audit rows.
- [ ] `NOT_VALIDATED` / null maturity.
- [ ] Engine shutdown and temp cleanup.

---

## 14. Known limitations

1. Recovery not executed; actual engine unverified.
2. No lockfile; versions unpinned.
3. 3.12 base missing; uv may need to download it.
4. Port default mismatch (8000 vs 8001).
5. Nested repo absent (cause unknown).
6. No scientific validation.

## 15. Independent review (Nemotron 3 Ultra)

Reviewed evidence.

1. Runtime/venv findings accurate; 3.12 recommendation matches CI and `requires-python`.
2. Recovery options correctly weigh isolation/reproducibility; no unsafe cross-version hack endorsed.
3. Proposed commands are labeled NOT EXECUTED and loopback-only.
4. Nested discrepancy reported without inference; engine unaffected.
5. Missing: executed recovery, lockfile, actual engine evidence.
6. No scope/git/DB violations.

**Reviewer verdict:** plan is technically sound and safe; accept with limitations.

## 16. Git integrity

`main` @ `a3103061f561eb4289137b5f3362785580dfe28b`; 0 staged/deleted; 28 modified; 141 untracked; no refs/history changes.

## 17. Production DB integrity

`databases/api/nojin.db` mtime `2026-11-26 04:55:35`, size 368640 — unchanged.

## 18. Final classification

`RUNTIME_RECOVERY_PLAN_READY_WITH_LIMITATIONS`

- **Ready:** verified recovery plan, compatibility matrix, startup/checklist.
- **Not executed:** installs/repairs/engine start.
- **Actual-engine-verified:** no.
- **Scientifically validated / production-approved:** no.

No installs, downloads, env changes, engine starts, git mutations, or DB changes. Phase 3.89 not started.