"""Local runner for the HyDroMA runtime.

Default binding is loopback (127.0.0.1). Binding a non-loopback interface
requires an explicit ``--allow-external`` flag, so the runtime cannot be
silently exposed to a network.
"""

from __future__ import annotations

import argparse
import os

from .api import create_app
from .jobs import JobStore

_LOOPBACK = {"127.0.0.1", "localhost", "::1"}


def is_loopback(host: str) -> bool:
    return host in _LOOPBACK


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="hydroma", description="HyDroMA local runtime")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--allow-external", action="store_true",
                        help="permit binding a non-loopback interface")
    args = parser.parse_args(argv)

    if not is_loopback(args.host) and not args.allow_external:
        raise SystemExit(
            f"refusing to bind non-loopback host {args.host!r} without --allow-external"
        )
    if not is_loopback(args.host):
        print(f"WARNING: binding non-loopback {args.host!r}; ensure firewall and auth")

    import uvicorn

    db_path = os.environ.get("HYDROMA_DB", "hydroma.db")
    store = JobStore(db_path)
    uvicorn.run(create_app(store=store), host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())