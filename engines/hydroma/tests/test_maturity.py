from hydroma.maturity import (
    MODEL_MATURITY,
    SCIENTIFIC_STATUS,
    MaturityEvidence,
    check_promotion,
    is_scientific_status,
    maturity_rank,
)


def test_maturity_order():
    assert maturity_rank("stub") == 0
    assert maturity_rank("tested") == 2
    assert maturity_rank("validated") == 4
    assert MODEL_MATURITY[-1] == "production_approved"


def test_promotion_requires_evidence():
    # stub -> implemented needs passing implementation evidence
    assert check_promotion("stub", "implemented", [])["ok"] is False
    ok = check_promotion("stub", "implemented", [MaturityEvidence("implementation", "pass")])
    assert ok["ok"] is True


def test_promotion_one_level_at_a_time():
    res = check_promotion("stub", "tested", [MaturityEvidence("unit_test", "pass")])
    assert res["ok"] is False
    assert "one level" in res["reason"]


def test_tested_requires_unit_test_evidence():
    ev = [MaturityEvidence("implementation", "pass")]
    # implemented -> tested needs unit_test
    res = check_promotion("implemented", "tested", ev)
    assert res["ok"] is False
    ev2 = ev + [MaturityEvidence("unit_test", "pass")]
    assert check_promotion("implemented", "tested", ev2)["ok"] is True


def test_production_approved_requires_validated():
    res = check_promotion("tested", "production_approved", [MaturityEvidence("owner_approval", "pass")])
    assert res["ok"] is False


def test_passing_tests_do_not_promote_scientific_status():
    # scientific status is a separate axis; a tested model can still be NOT_VALIDATED
    assert is_scientific_status("NOT_VALIDATED") is True
    assert is_scientific_status("validated") is False  # lowercase is not a scientific status
    assert "VALIDATED" in SCIENTIFIC_STATUS
    assert "NOT_VALIDATED" in SCIENTIFIC_STATUS