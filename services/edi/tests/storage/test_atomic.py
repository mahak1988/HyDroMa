from edi.storage.atomic import atomic_write_bytes, atomic_write_json, sha256_file


def test_atomic_write(tmp_path):
    path = tmp_path / "x.bin"
    digest = atomic_write_bytes(path, b"hello")
    assert path.read_bytes() == b"hello"
    assert sha256_file(path) == digest


def test_atomic_json(tmp_path):
    path = tmp_path / "x.json"
    digest = atomic_write_json(path, {"a": 1})
    assert path.exists()
    assert len(digest) == 64