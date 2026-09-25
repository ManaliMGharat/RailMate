import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_mmct_to_pune_search_with_all_class():
    """Verify that MMCT -> PUNE returns trains even when class_type is ALL."""
    res = client.get("/api/trains/search?from_station=MMCT&to_station=PUNE&class_type=ALL")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    assert len(data["trains"]) > 0
    # Direct trains or cluster trains should be present
    train_numbers = [t["number"] for t in data["trains"]]
    assert any(num in ["12127", "12128", "22225", "22226", "12123", "22105"] for num in train_numbers)

def test_date_search_both_formats():
    """Verify both YYYY-MM-DD and DD-MM-YYYY formats work properly."""
    res1 = client.get("/api/trains/search?from_station=MMCT&to_station=PUNE&date=2026-10-15")
    assert res1.status_code == 200
    assert res1.json()["journey_date"] == "2026-10-15"

    res2 = client.get("/api/trains/search?from_station=MMCT&to_station=PUNE&date=15-10-2026")
    assert res2.status_code == 200
    assert res2.json()["journey_date"] == "2026-10-15"

def test_phone_otp_flow_and_verification():
    """Test send OTP and verify OTP for Indian mobile number."""
    # 1. Invalid phone number test
    bad_res = client.post("/api/auth/send-phone-otp", json={"phone_number": "12345"})
    assert bad_res.status_code == 400

    # 2. Valid phone number send OTP
    send_res = client.post("/api/auth/send-phone-otp", json={"phone_number": "9812345678"})
    assert send_res.status_code == 200
    send_data = send_res.json()
    assert send_data["success"] is True
    assert send_data["demo_otp"] == "123456"

    # 3. Verify OTP with incorrect code
    fail_res = client.post("/api/auth/verify-phone-otp", json={
        "phone_number": "+919812345678",
        "otp": "999999"
    })
    assert fail_res.status_code == 400

    # 4. Verify OTP with correct code
    ok_res = client.post("/api/auth/verify-phone-otp", json={
        "phone_number": "+919812345678",
        "otp": "123456"
    })
    assert ok_res.status_code == 200
    assert ok_res.json()["success"] is True

def test_register_and_phone_verification_flag():
    """Test registration creates unverified phone user and verification updates flag."""
    import random
    rand_digits = random.randint(10000000, 99999999)
    test_mobile = f"98{rand_digits}"
    test_email = f"phoneuser_{rand_digits}@example.com"
    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "mobile": test_mobile,
        "full_name": "Test Phone User",
        "password": "Password123!"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["user"]["is_phone_verified"] is False
    assert reg_data["user"]["mobile"] == f"+91{test_mobile}"

    # Verify phone OTP for this user
    ver_res = client.post("/api/auth/verify-phone-otp", json={
        "phone_number": f"+91{test_mobile}",
        "otp": "123456"
    })
    assert ver_res.status_code == 200

    # Login and check is_phone_verified is now True
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert login_res.json()["user"]["is_phone_verified"] is True

