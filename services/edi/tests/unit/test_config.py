from edi.config import load_config
from edi.errors import InvalidConfiguration


def test_default_offline(tmp_path):
    config = load_config({"EDI_DATA_DIR": str(tmp_path)})
    assert config.environment == "local"
    assert config.live_acquisition_enabled is False
    assert config.data_dir == tmp_path
    config.ensure_directories()
    assert config.sqlite_path.parent.exists()


def test_invalid_max_file_size(tmp_path):
    try:
        load_config({"EDI_DATA_DIR": str(tmp_path), "EDI_MAX_FILE_SIZE": "0"})
    except InvalidConfiguration as exc:
        assert exc.code == "INVALID_CONFIGURATION"
    else:
        raise AssertionError("expected InvalidConfiguration")


def test_live_acquisition_requires_domains(tmp_path):
    try:
        load_config({"EDI_DATA_DIR": str(tmp_path), "EDI_LIVE_ACQUISITION": "1"})
    except InvalidConfiguration as exc:
        assert exc.code == "INVALID_CONFIGURATION"
    else:
        raise AssertionError("expected InvalidConfiguration")