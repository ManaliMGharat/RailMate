import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "RailMate API"
    assert data["demo_mode"] is True

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "email": "demo@railmate.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["full_name"] == "Manali Manish Gharat"

def test_station_search():
    response = client.get("/api/stations/search?q=mumbai")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) > 0
    assert any(s["code"] == "MMCT" for s in stations)

def test_train_search():
    response = client.get("/api/trains/search?from_station=MMCT&to_station=NDLS")
    assert response.status_code == 200
    data = response.json()
    assert "trains" in data
    assert len(data["trains"]) > 0

def test_pnr_status():
    response = client.get("/api/pnr/8421098451")
    assert response.status_code == 200
    data = response.json()
    assert data["pnr_number"] == "8421098451"
    assert len(data["passengers"]) > 0

def test_track_train():
    response = client.get("/api/trains/12951/running-status")
    assert response.status_code == 200
    data = response.json()
    assert data["train_number"] == "12951"
    assert len(data["timeline"]) > 0

def test_coach_position():
    response = client.get("/api/trains/12951/coach-position")
    assert response.status_code == 200
    data = response.json()
    assert len(data["coaches"]) > 0
