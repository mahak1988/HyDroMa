import threading

from hydroma.jobs import JobStore


def test_lifecycle_complete():
    store = JobStore(":memory:")
    run_id = store.create_run("m", "1.0.0", "alice", {"a": 1})
    run = store.get_run(run_id)
    assert run["status"] == "queued"
    assert run["attempts"] == 0

    assert store.claim(run_id, "w1") is True
    run = store.get_run(run_id)
    assert run["status"] == "running"
    assert run["attempts"] == 1
    assert run["worker_id"] == "w1"

    store.complete(run_id, {"ok": True}, {"run_id": run_id})
    run = store.get_run(run_id)
    assert run["status"] == "completed"
    assert run["result_json"] == {"ok": True}
    assert run["provenance_json"] == {"run_id": run_id}


def test_double_claim_rejected():
    store = JobStore(":memory:")
    run_id = store.create_run("m", "1.0.0", "alice", {})
    assert store.claim(run_id, "w1") is True
    assert store.claim(run_id, "w2") is False


def test_concurrent_claim_only_one_wins():
    store = JobStore(":memory:")
    run_id = store.create_run("m", "1.0.0", "alice", {})
    results = []
    lock = threading.Lock()

    def worker():
        won = store.claim(run_id, "w")
        with lock:
            results.append(won)

    threads = [threading.Thread(target=worker) for _ in range(8)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sum(1 for r in results if r) == 1
    assert store.get_run(run_id)["status"] == "running"


def test_fail_records_error():
    store = JobStore(":memory:")
    run_id = store.create_run("m", "1.0.0", "alice", {})
    store.claim(run_id)
    store.fail(run_id, {"code": "NUMERICAL_FAILURE", "message": "boom"})
    run = store.get_run(run_id)
    assert run["status"] == "failed"
    assert run["error_json"]["code"] == "NUMERICAL_FAILURE"


def test_complete_requires_running():
    store = JobStore(":memory:")
    run_id = store.create_run("m", "1.0.0", "alice", {})
    store.complete(run_id, {"ok": True}, {"run_id": run_id})  # not running -> ignored
    assert store.get_run(run_id)["status"] == "queued"


def test_recover_stale_requeues():
    store = JobStore(":memory:")
    run_id = store.create_run("m", "1.0.0", "alice", {})
    store.claim(run_id)
    store._conn.execute(
        "UPDATE runs SET heartbeat_at='2000-01-01T00:00:00+00:00' WHERE run_id=?",
        (run_id,),
    )
    store._conn.commit()
    requeued = store.recover_stale(timeout_seconds=300)
    assert requeued == 1
    assert store.get_run(run_id)["status"] == "queued"


def test_persistence_across_restart(tmp_path):
    db = str(tmp_path / "jobs.db")
    store = JobStore(db)
    run_id = store.create_run("m", "1.0.0", "alice", {"x": 1})
    store.claim(run_id)
    store.complete(run_id, {"ok": True}, {"run_id": run_id})
    store.close()

    reopened = JobStore(db)
    run = reopened.get_run(run_id)
    assert run["status"] == "completed"
    assert run["result_json"] == {"ok": True}
    reopened.close()


def test_list_runs():
    store = JobStore(":memory:")
    store.create_run("m", "1.0.0", "alice", {})
    store.create_run("m", "1.0.0", "bob", {})
    assert len(store.list_runs()) == 2