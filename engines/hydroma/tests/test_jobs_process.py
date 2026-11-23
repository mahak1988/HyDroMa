"""Process-level concurrency for the SQLite job store.

Independent OS processes, each with its own connection, race to claim the same
queued run. Exactly one must win; the rest must observe a non-queued state. This
is NOT distributed execution - it only proves the claim is safe across processes
on one machine.
"""

import pathlib
import subprocess
import sys

from hydroma.jobs import JobStore

_HYDROMA_DIR = pathlib.Path(__file__).resolve().parents[1]

_CLAIM_CODE = (
    "import sys;"
    "from hydroma.jobs import JobStore;"
    "s=JobStore(sys.argv[1]);"
    "print(1 if s.claim(sys.argv[2], 'w') else 0)"
)


def test_process_concurrency_single_winner(tmp_path):
    db = str(tmp_path / "jobs.db")
    store = JobStore(db)
    run_id = store.create_run("m", "1.0.0", "alice", {})
    store.close()

    n = 6
    procs = [
        subprocess.Popen(
            [sys.executable, "-c", _CLAIM_CODE, db, run_id],
            cwd=str(_HYDROMA_DIR),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        )
        for _ in range(n)
    ]
    outs = []
    for p in procs:
        out, err = p.communicate(timeout=60)
        assert p.returncode == 0, err
        outs.append(out.strip())

    winners = sum(1 for o in outs if o == "1")
    assert winners == 1, f"expected exactly one winner, got {winners} from {outs}"

    reopened = JobStore(db)
    run = reopened.get_run(run_id)
    assert run["status"] == "running"
    assert run["attempts"] == 1
    reopened.close()


def test_stale_recovery_not_silent_success(tmp_path):
    db = str(tmp_path / "jobs.db")
    store = JobStore(db)
    run_id = store.create_run("m", "1.0.0", "alice", {})
    store.claim(run_id, "w1")
    store._conn.execute(
        "UPDATE runs SET heartbeat_at='2000-01-01T00:00:00+00:00' WHERE run_id=?",
        (run_id,),
    )
    store._conn.commit()
    requeued = store.recover_stale(timeout_seconds=300)
    assert requeued == 1
    run = store.get_run(run_id)
    assert run["status"] == "queued"  # requeued, NOT completed
    assert run["worker_id"] is None
    store.close()