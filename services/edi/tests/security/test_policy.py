import pytest

from edi.errors import SecurityPolicyViolation
from edi.security.policy import SecurityPolicy, redact


def policy(resolver=None):
    return SecurityPolicy(
        allowed_domains=("power.larc.nasa.gov",),
        host_resolver=resolver or (lambda host: ["93.184.216.34"]),
    )


def test_valid_url():
    policy().validate_url("https://power.larc.nasa.gov/api")


def test_http_rejected():
    with pytest.raises(SecurityPolicyViolation):
        policy().validate_url("http://power.larc.nasa.gov/api")


def test_private_ip_rejected():
    with pytest.raises(SecurityPolicyViolation):
        policy().validate_url("https://127.0.0.1/api")


def test_unlisted_host_rejected():
    with pytest.raises(SecurityPolicyViolation):
        policy().validate_url("https://example.com/api")


def test_dns_private_rejected():
    p = policy(lambda host: ["127.0.0.1"])
    with pytest.raises(SecurityPolicyViolation):
        p.validate_url("https://power.larc.nasa.gov/api")


def test_dns_mixed_rejected():
    p = policy(lambda host: ["93.184.216.34", "10.0.0.1"])
    with pytest.raises(SecurityPolicyViolation):
        p.validate_url("https://power.larc.nasa.gov/api")


def test_dns_ipv6_private_rejected():
    p = policy(lambda host: ["::1"])
    with pytest.raises(SecurityPolicyViolation):
        p.validate_url("https://power.larc.nasa.gov/api")


def test_redirect_to_private_rejected():
    p = policy(lambda host: ["127.0.0.1"])
    with pytest.raises(SecurityPolicyViolation):
        p.validate_redirect("https://power.larc.nasa.gov/x", "https://power.larc.nasa.gov/y")


def test_redirect_to_disallowed_rejected():
    with pytest.raises(SecurityPolicyViolation):
        policy().validate_redirect("https://example.com/x", "https://power.larc.nasa.gov/y")


def test_https_downgrade_rejected():
    with pytest.raises(SecurityPolicyViolation):
        policy().validate_url("http://power.larc.nasa.gov/api")


def test_invalid_port_rejected():
    with pytest.raises(SecurityPolicyViolation):
        policy().validate_url("https://power.larc.nasa.gov:8443/api")


def test_path_traversal_rejected(tmp_path):
    with pytest.raises(SecurityPolicyViolation):
        policy().validate_path("../x", tmp_path)


def test_safe_path(tmp_path):
    path = policy().validate_path("raw/x.csv", tmp_path)
    assert path == (tmp_path / "raw" / "x.csv").resolve()


def test_filename():
    assert policy().validate_filename("x.csv") == "x.csv"
    with pytest.raises(SecurityPolicyViolation):
        policy().validate_filename("../x.csv")


def test_file_size():
    p = SecurityPolicy(max_file_size=10)
    p.check_file_size(5)
    with pytest.raises(SecurityPolicyViolation):
        p.check_file_size(11)


def test_content_type():
    p = SecurityPolicy()
    p.validate_content_type("text/csv; charset=utf-8")
    with pytest.raises(SecurityPolicyViolation):
        p.validate_content_type("text/html")


def test_live_gate():
    p = SecurityPolicy(live_acquisition_enabled=True)
    with pytest.raises(SecurityPolicyViolation):
        p.check_live_acquisition_gate()
    p.security_tests_passed = True
    p.provider_authorized = True
    p.owner_approval = True
    p.check_live_acquisition_gate()


def test_redact():
    text = "Authorization: Bearer secret; token=abc; password=xyz"
    redacted = redact(text)
    assert "secret" not in redacted
    assert "abc" not in redacted
    assert "xyz" not in redacted