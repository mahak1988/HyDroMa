"""Gateway tests: redaction, secret rejection, usage accounting, no egress."""

import pytest

from ai_workforce.audit import utc_now_iso
from ai_workforce.gateway import (
    GatewayNotConnected,
    ProviderKeyRejected,
    REDACTION_RULES,
    TokenUsageRecord,
    assert_no_provider_secrets,
    call_provider,
    redact,
)


def test_redact_provider_api_key():
    text = "call with sk-abcdefgh12345678 key please"
    result = redact(text)
    assert result["changed"] is True
    assert "PROVIDER_API_KEY" in result["applied_rules"]
    assert "sk-abcdefgh12345678" not in result["redacted"]
    assert "[REDACTED:PROVIDER_API_KEY]" in result["redacted"]
    assert text == "call with sk-abcdefgh12345678 key please"  # input never mutated


def test_redact_bearer_and_authorization():
    header = redact("Authorization: Bearer abcdefghijklmnop")
    assert "AUTHORIZATION_HEADER" in header["applied_rules"]
    assert "abcdefghijklmnop" not in header["redacted"]
    bearer = redact("use bearer zzzzzzzzzzzzzzzz token")
    assert "BEARER_TOKEN" in bearer["applied_rules"]
    assert "zzzzzzzzzzzzzzzz" not in bearer["redacted"]


def test_redact_clean_text_reports_no_change():
    result = redact("nothing sensitive here")
    assert result == {"redacted": "nothing sensitive here", "applied_rules": [], "changed": False}


def test_redaction_rules_are_declared_and_deterministic():
    names = [rule.name for rule in REDACTION_RULES]
    assert names == ["PROVIDER_API_KEY", "AUTHORIZATION_HEADER", "BEARER_TOKEN"]
    assert redact("sk-abcdefghijklmnop")["redacted"] == redact("sk-abcdefghijklmnop")["redacted"]


def test_provider_secret_rejected_by_key_name_only():
    config = {"api_key": "super-secret-value-123", "model": "x"}
    with pytest.raises(ProviderKeyRejected) as excinfo:
        assert_no_provider_secrets(config)
    assert "api_key" in str(excinfo.value)
    # the VALUE must never appear in the message, repr or args
    assert "super-secret-value-123" not in str(excinfo.value)
    assert "super-secret-value-123" not in repr(excinfo.value)
    for arg in excinfo.value.args:
        assert "super-secret-value-123" not in str(arg)


def test_clean_config_accepted():
    assert_no_provider_secrets({"model": "m", "provider": "p", "temperature": 0.1})


@pytest.mark.parametrize("key", ["secret", "password", "access_token", "private_key", "APIKEY"])
def test_secret_key_names_cover_common_variants(key):
    with pytest.raises(ProviderKeyRejected):
        assert_no_provider_secrets({key: "v"})


def test_token_usage_record_valid_and_serializable():
    record = TokenUsageRecord(
        provider="local",
        model="demo-model",
        input_tokens=100,
        output_tokens=50,
        recorded_at_utc=utc_now_iso(),
        note="governance-plane accounting only",
    )
    assert record.validate() == []
    payload = record.to_dict()
    assert payload["input_tokens"] == 100
    assert payload["output_tokens"] == 50


@pytest.mark.parametrize(
    "kwargs,code",
    [
        ({"provider": "", "model": "m", "input_tokens": 1, "output_tokens": 1}, "PROVIDER_MISSING"),
        ({"provider": "p", "model": " ", "input_tokens": 1, "output_tokens": 1}, "MODEL_MISSING"),
        (
            {"provider": "p", "model": "m", "input_tokens": -1, "output_tokens": 1},
            "TOKENS_INVALID",
        ),
        (
            {"provider": "p", "model": "m", "input_tokens": 1, "output_tokens": -5},
            "TOKENS_INVALID",
        ),
        ({"provider": "p", "model": "m", "input_tokens": 1, "output_tokens": 1, "cost": -2}, "COST_INVALID"),
    ],
)
def test_token_usage_validation(kwargs, code):
    record = TokenUsageRecord(recorded_at_utc=utc_now_iso(), **kwargs)
    assert code in [e["code"] for e in record.validate()]


def test_call_provider_always_refuses():
    with pytest.raises(GatewayNotConnected) as excinfo:
        call_provider(prompt="hello", model="m")
    assert "NOT_ACTIVE" in str(excinfo.value)


def test_gateway_has_no_network_client_imported():
    import ai_workforce.gateway as gateway_module

    source = open(gateway_module.__file__, "r", encoding="utf-8").read()
    assert "httpx" not in source
    assert "requests" not in source
    assert "urllib.request" not in source
    assert "socket" not in source
