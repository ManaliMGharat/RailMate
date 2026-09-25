import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ============================================================================
# 1. STATION MASTER & SEARCH TESTS
# ============================================================================

def test_station_search_exact_code():
    res = client.get("/api/stations/search?q=KYN")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert data[0]["code"] == "KYN"
    assert "Kalyan" in data[0]["name"]
    assert data[0]["is_junction"] is True

def test_station_search_by_alias_cst():
    res = client.get("/api/stations/search?q=cst")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert data[0]["code"] == "CSMT"

def test_station_search_by_alias_bombay():
    res = client.get("/api/stations/search?q=bombay")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2
    codes = [s["code"] for s in data]
    assert "CSMT" in codes or "MMCT" in codes

def test_station_popular_endpoints():
    res = client.get("/api/stations/popular?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data) <= 10
    codes = [s["code"] for s in data]
    assert "CSMT" in codes
    assert "NDLS" in codes

def test_station_by_code():
    res = client.get("/api/stations/MMCT")
    assert res.status_code == 200
    data = res.json()
    assert data["code"] == "MMCT"
    assert data["city"] == "Mumbai"
    assert "WR" in data["zone"]
    assert "Western Railway" in data["zone"]

def test_station_by_code_not_found():
    res = client.get("/api/stations/INVALIDXYZ")
    assert res.status_code == 404


# ============================================================================
# 2. INTERMEDIATE ROUTE ORDERING TESTS
# ============================================================================

def test_intermediate_train_search_kyn_to_pune():
    res = client.get("/api/trains/search?from_station=KYN&to_station=PUNE")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    # Should include Deccan Queen (12123) and Indrayani Express (22105)
    train_numbers = [t["number"] for t in data["trains"]]
    assert "12123" in train_numbers or "22105" in train_numbers

    # Verify stop times are intermediate (not terminus)
    deccan = next((t for t in data["trains"] if t["number"] == "12123"), None)
    if deccan:
        # Deccan Queen departs CSMT at 17:10, departs KYN at 18:05, arrives PUNE at 20:25
        assert deccan["departure_time"] == "18:05"
        assert deccan["arrival_time"] == "20:25"
        assert deccan["duration_hours"] < 3.0

def test_intermediate_train_search_pune_to_kyn():
    res = client.get("/api/trains/search?from_station=PUNE&to_station=KYN")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0
    # Deccan Queen Return (12124) runs PUNE -> KYN
    train_numbers = [t["number"] for t in data["trains"]]
    assert "12124" in train_numbers


# ============================================================================
# 3. 6-DIGIT mPIN AUTHENTICATION TESTS
# ============================================================================

def test_mpin_status_demo_user():
    res = client.get("/api/auth/mpin/status?email_or_mobile=demo@railmate.com")
    assert res.status_code == 200
    data = res.json()
    assert data["has_mpin"] is True
    assert data["mpin_enabled"] is True
    assert data["is_locked"] is False
    assert data["attempts_remaining"] == 5

def test_mpin_verify_success():
    res = client.post("/api/auth/mpin/verify", json={
        "email_or_mobile": "demo@railmate.com",
        "mpin": "123456"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@railmate.com"

def test_mpin_verify_invalid_format():
    res = client.post("/api/auth/mpin/verify", json={
        "email_or_mobile": "demo@railmate.com",
        "mpin": "123" # less than 6 digits
    })
    assert res.status_code == 400

def test_mpin_verify_incorrect_and_lockout():
    # Login first to get fresh token
    login_res = client.post("/api/auth/login", json={
        "email": "demo@railmate.com",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Set known fresh mPIN
    client.post("/api/auth/mpin/set", json={"mpin": "654321"}, headers=headers)

    # 4 incorrect attempts -> 401 with remaining attempts
    for attempt in range(1, 5):
        res = client.post("/api/auth/mpin/verify", json={
            "email_or_mobile": "demo@railmate.com",
            "mpin": "000000"
        })
        assert res.status_code == 401
        assert f"{5 - attempt} attempt(s) remaining" in res.json()["detail"]

    # 5th incorrect attempt -> 423 locked
    res5 = client.post("/api/auth/mpin/verify", json={
        "email_or_mobile": "demo@railmate.com",
        "mpin": "000000"
    })
    assert res5.status_code == 423
    assert "locked" in res5.json()["detail"].lower()

    # Reset back to default 123456 using password login
    client.post("/api/auth/mpin/set", json={"mpin": "123456"}, headers=headers)


# ============================================================================
# 4. WEBAUTHN BIOMETRIC ENDPOINTS TESTS
# ============================================================================

def test_biometric_login_challenge():
    res = client.post("/api/auth/biometric/login-challenge?email_or_mobile=demo@railmate.com")
    assert res.status_code == 200
    data = res.json()
    assert "challenge" in data
    assert data["rp_name"] == "RailOne"

def test_biometric_login_verify_demo():
    res = client.post("/api/auth/biometric/login-verify", json={
        "email_or_mobile": "demo@railmate.com",
        "credential_id": "demo-cred-123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Manali Manish Gharat"

def test_biometric_status():
    res = client.get("/api/auth/biometric/status?email_or_mobile=demo@railmate.com")
    assert res.status_code == 200
    data = res.json()
    assert "biometric_enabled" in data
    assert "credentials_count" in data


# ============================================================================
# 5. CSV STATION IMPORTER & BOOKING CODE VERIFICATION
# ============================================================================

def test_csv_stations_importer_and_validation():
    from app.seed.import_csv_stations import load_and_validate_csv_stations
    stations, stats = load_and_validate_csv_stations()
    assert len(stations) == 50
    assert stats["imported"] == 50
    assert stats["duplicates"] == 0
    assert stats["rejected"] == 0
    codes = {s["code"] for s in stations}
    assert "CSMT" in codes
    assert "NDLS" in codes
    assert "HWH" in codes
    assert "MAS" in codes
    assert "ADI" in codes

def test_station_search_by_state():
    res = client.get("/api/stations/search?q=Maharashtra")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    states = [s["state"] for s in data]
    assert all("Maharashtra" in st for st in states)

def test_booking_with_canonical_station_codes():
    # Login as demo user
    login_res = client.post("/api/auth/login", json={"email": "demo@railmate.com", "password": "password123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Find train for KYN -> PUNE
    search_res = client.get("/api/trains/search?from_station=KYN&to_station=PUNE&journey_date=2026-09-25")
    assert search_res.status_code == 200
    trains = search_res.json()["trains"]
    assert len(trains) > 0
    train = trains[0]

    # Create booking using canonical source_station_code and destination_station_code
    book_res = client.post("/api/bookings", headers=headers, json={
        "train_id": train["id"],
        "source_station_code": "KYN",
        "destination_station_code": "PUNE",
        "journey_date": "2026-09-25",
        "travel_class": "CC" if "CC" in train["available_classes"] else "2S",
        "quota": "General",
        "passengers": [
            {
                "name": "Manali Manish Gharat",
                "age": 28,
                "gender": "Female",
                "berth_preference": "Window"
            }
        ],
        "payment_method": "UPI"
    })
    assert book_res.status_code == 200
    bdata = book_res.json()
    assert "pnr_number" in bdata
    assert bdata["status"] == "CONFIRMED"

