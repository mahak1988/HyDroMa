"""Artifact & status tests (offline)."""

import pytest

from hydroma.data import is_data_artifact
from hydroma.connect.artifacts import build_artifact, set_artifact_status, ArtifactManifest
from hydroma.connect.base import ArtifactStatus


def test_build_local_artifact():
    a = build_artifact(artifact_id="x:1", source_id="chirps", dataset_id="chirps-v2.0",
                       local_path="/cache/abc.bin", checksum="deadbeef",
                       media_type="image/tiff", license="CC BY 3.0", status="VERIFIED")
    assert is_data_artifact(a)
    assert a["localPath"] == "/cache/abc.bin" and a["uri"] == "/cache/abc.bin"
    assert a["checksumAlgorithm"] == "sha256"


def test_build_remote_reference_not_local():
    a = build_artifact(artifact_id="x:2", source_id="sentinel-2", dataset_id="sentinel-2-l2a",
                       remote_reference="https://ref/cog.tif", status="REFERENCED")
    assert is_data_artifact(a)
    assert "localPath" not in a  # never claim local acquisition
    assert a["acquisitionStatus"] == "REFERENCED"


def test_requires_uri():
    with pytest.raises(ValueError):
        build_artifact(artifact_id="x:3", source_id="s", dataset_id="d")


def test_status_transitions():
    a = build_artifact(artifact_id="x:4", source_id="s", dataset_id="d",
                       remote_reference="https://r", status="DISCOVERED")
    a2 = set_artifact_status(a, "REFERENCED")
    a3 = set_artifact_status(a2, "ACQUIRED")
    a4 = set_artifact_status(a3, "VERIFIED")
    assert a4["acquisitionStatus"] == "VERIFIED"
    with pytest.raises(ValueError):
        set_artifact_status(a, "QC_REVIEWED")  # illegal jump


def test_manifest():
    m = ArtifactManifest()
    a = build_artifact(artifact_id="x:5", source_id="s", dataset_id="d",
                       remote_reference="https://r", status="DISCOVERED")
    m.add(a)
    assert m.ids() == ["x:5"]
    assert len(m.by_status("DISCOVERED")) == 1
    with pytest.raises(ValueError):
        m.add(a)