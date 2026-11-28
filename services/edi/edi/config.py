"""EDI configuration."""

import os
from dataclasses import dataclass, field
from pathlib import Path

from edi.errors import InvalidConfiguration


@dataclass
class Config:
    environment: str = "local"
    data_dir: Path = field(default_factory=lambda: Path.cwd() / "data")
    raw_dir: Path = field(default_factory=lambda: Path.cwd() / "data" / "raw")
    parquet_dir: Path = field(default_factory=lambda: Path.cwd() / "data" / "parquet")
    quarantine_dir: Path = field(default_factory=lambda: Path.cwd() / "data" / "quarantine")
    manifest_dir: Path = field(default_factory=lambda: Path.cwd() / "data" / "manifests")
    sqlite_path: Path = field(default_factory=lambda: Path.cwd() / "data" / "edi.db")
    max_file_size: int = 1024 * 1024 * 1024
    live_acquisition_enabled: bool = False
    allowed_domains: tuple[str, ...] = ()
    require_https: bool = True
    max_redirects: int = 3
    allowed_content_types: tuple[str, ...] = (
        "text/csv",
        "application/json",
        "application/x-netcdf",
        "image/tiff",
        "application/x-hdf",
    )

    def validate(self) -> None:
        if self.environment not in {"local", "test", "development", "production"}:
            raise InvalidConfiguration(
                "invalid environment",
                {"environment": self.environment},
            )
        if self.max_file_size <= 0:
            raise InvalidConfiguration(
                "max_file_size must be positive",
                {"max_file_size": self.max_file_size},
            )
        if self.max_redirects < 0:
            raise InvalidConfiguration(
                "max_redirects must be non-negative",
                {"max_redirects": self.max_redirects},
            )
        if not self.allowed_content_types:
            raise InvalidConfiguration("allowed_content_types must not be empty")
        if self.live_acquisition_enabled and not self.allowed_domains:
            raise InvalidConfiguration(
                "live acquisition requires at least one allowed domain",
            )

    def ensure_directories(self) -> None:
        for path in (
            self.data_dir,
            self.raw_dir,
            self.parquet_dir,
            self.quarantine_dir,
            self.manifest_dir,
        ):
            path.mkdir(parents=True, exist_ok=True)
        self.sqlite_path.parent.mkdir(parents=True, exist_ok=True)


def load_config(
    env: dict[str, str] | None = None,
    data_dir: str | Path | None = None,
) -> Config:
    env = os.environ if env is None else env
    base = Path(data_dir) if data_dir is not None else Path(env.get("EDI_DATA_DIR", "data"))
    domains = tuple(
        item.strip()
        for item in env.get("EDI_ALLOWED_DOMAINS", "").split(",")
        if item.strip()
    )
    config = Config(
        environment=env.get("EDI_ENV", "local"),
        data_dir=base,
        raw_dir=base / "raw",
        parquet_dir=base / "parquet",
        quarantine_dir=base / "quarantine",
        manifest_dir=base / "manifests",
        sqlite_path=base / "edi.db",
        max_file_size=int(env.get("EDI_MAX_FILE_SIZE", "1073741824")),
        live_acquisition_enabled=env.get("EDI_LIVE_ACQUISITION", "0") == "1",
        allowed_domains=domains,
        require_https=env.get("EDI_REQUIRE_HTTPS", "1") != "0",
        max_redirects=int(env.get("EDI_MAX_REDIRECTS", "3")),
    )
    config.validate()
    return config