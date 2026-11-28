"""Local acquisition cache (stdlib-only): deterministic keys, atomic writes,
checksum verification, no silent overwrite of verified files.
"""

from __future__ import annotations

import hashlib
import json
import os
from typing import Any, Dict, Optional, Tuple

from .acquisition import safe_join
from .base import ConnectorError

__all__ = ["CacheManager"]


class CacheManager:
    def __init__(self, cache_dir: str) -> None:
        self.cache_dir = os.path.abspath(cache_dir)
        os.makedirs(self.cache_dir, exist_ok=True)

    def key(self, source_id: str, dataset_id: str, dataset_version: Optional[str],
            url: str) -> str:
        h = hashlib.sha256()
        h.update(f"{source_id}|{dataset_id}|{dataset_version or ''}|{url}".encode("utf-8"))
        return h.hexdigest()

    def _paths(self, key: str) -> Tuple[str, str]:
        base = safe_join(self.cache_dir, key[:2], key)
        return base + ".bin", base + ".json"

    def get_verified(self, key: str) -> Optional[Tuple[str, Dict[str, Any]]]:
        bin_path, meta_path = self._paths(key)
        if not (os.path.exists(bin_path) and os.path.exists(meta_path)):
            return None
        with open(meta_path, "r", encoding="utf-8") as fh:
            meta = json.load(fh)
        expected = meta.get("checksum")
        if not expected:
            return None
        if self._sha256_file(bin_path) != expected:
            return None
        return bin_path, meta

    def put(self, key: str, data: bytes, metadata: Dict[str, Any]) -> str:
        bin_path, meta_path = self._paths(key)
        existing = self.get_verified(key)
        if existing is not None:
            return existing[0]
        os.makedirs(os.path.dirname(bin_path), exist_ok=True)
        tmp = bin_path + ".part"
        with open(tmp, "wb") as fh:
            fh.write(data)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, bin_path)
        meta = dict(metadata)
        meta["checksum"] = hashlib.sha256(data).hexdigest()
        meta["size_bytes"] = len(data)
        tmp_meta = meta_path + ".part"
        with open(tmp_meta, "w", encoding="utf-8") as fh:
            json.dump(meta, fh, sort_keys=True)
        os.replace(tmp_meta, meta_path)
        return bin_path

    def status(self, key: str) -> str:
        if self.get_verified(key) is not None:
            return "VERIFIED"
        bin_path, _ = self._paths(key)
        return "INCOMPLETE" if os.path.exists(bin_path) else "MISSING"

    @staticmethod
    def _sha256_file(path: str) -> str:
        h = hashlib.sha256()
        with open(path, "rb") as fh:
            for chunk in iter(lambda: fh.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()