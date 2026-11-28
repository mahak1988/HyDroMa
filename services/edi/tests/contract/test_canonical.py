from conftest import make_record
from edi.contracts.canonical import validate_record


def test_record_roundtrip(record):
    validate_record(record)
    assert record["contract_version"] == "1.0.0"
    assert record["variable"] == "air_temperature"
    assert record["unit"] == "degC"