import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import Station
from sqlalchemy import func
from app.seed.mumbai_suburban_data import (
    WESTERN_LINE_SEQUENCE,
    CENTRAL_MAIN_SEQUENCE,
    CENTRAL_KASARA_SEQUENCE,
    CENTRAL_KARJAT_SEQUENCE,
    KARJAT_KHOPOLI_SEQUENCE,
    HARBOUR_LINE_SEQUENCE,
    TRANS_HARBOUR_VASHI_SEQUENCE,
    TRANS_HARBOUR_NERUL_PANVEL_SEQUENCE,
    NERUL_URAN_SEQUENCE,
    BELAPUR_URAN_SEQUENCE
)

client = TestClient(app)

def test_mumbai_suburban_deduplication():
    """Verify zero duplicate station codes and correct corridor presence."""
    db = SessionLocal()
    dup_codes = db.query(Station.code, func.count(Station.id)).group_by(Station.code).having(func.count(Station.id) > 1).all()
    db.close()
    assert len(dup_codes) == 0, f"Found duplicate station codes: {dup_codes}"

def test_mumbai_suburban_corridor_counts():
    """Verify all suburban corridor stations exist in database."""
    db = SessionLocal()
    corridors = {
        "Western Line": WESTERN_LINE_SEQUENCE,
        "Central Main": CENTRAL_MAIN_SEQUENCE,
        "Central Kasara": CENTRAL_KASARA_SEQUENCE,
        "Central Karjat": CENTRAL_KARJAT_SEQUENCE,
        "Karjat-Khopoli": KARJAT_KHOPOLI_SEQUENCE,
        "Harbour Line": HARBOUR_LINE_SEQUENCE,
        "Trans-Harbour (Vashi)": TRANS_HARBOUR_VASHI_SEQUENCE,
        "Trans-Harbour (Panvel)": TRANS_HARBOUR_NERUL_PANVEL_SEQUENCE,
        "Nerul-Uran": NERUL_URAN_SEQUENCE,
        "Belapur-Uran": BELAPUR_URAN_SEQUENCE
    }
    for cname, seq in corridors.items():
        for code in seq:
            st = db.query(Station).filter(Station.code == code).first()
            assert st is not None, f"Station {code} missing in corridor {cname}"
            assert st.is_active is True
            assert st.station_type == "SUBURBAN"
    db.close()

def test_reused_canonical_stations_not_duplicated():
    """Verify shared stations like Dadar, Kurla, Vashi, Nerul have exactly one canonical record."""
    db = SessionLocal()
    reused = ["CSMT", "MMCT", "DR", "BVI", "BSR", "TNA", "KYN", "KJT", "PNVL", "CLA", "VSH", "NEU", "SWDV", "BEPR"]
    for code in reused:
        count = db.query(Station).filter(Station.code == code).count()
        assert count == 1, f"Expected exactly 1 record for {code}, found {count}"
        st = db.query(Station).filter(Station.code == code).first()
        assert st.corridors is not None and len(st.corridors) > 0
    db.close()

@pytest.mark.parametrize("query, expected_code", [
    ("Churchgate", "CCG"),
    ("Andheri", "ADH"),
    ("ADH", "ADH"),
    ("Borivali", "BVI"),
    ("BVI", "BVI"),
    ("Kalyan", "KYN"),
    ("KYN", "KYN"),
    ("Thane", "TNA"),
    ("TNA", "TNA"),
    ("Vashi", "VSH"),
    ("Nerul", "NEU"),
    ("Uran", "URAN"),
    ("Kharkopar", "KARP"),
    ("Bamandongri", "BMDR"),
    ("Dronagiri", "DRGI"),
])
def test_suburban_station_search(query, expected_code):
    """Verify autocomplete and search finds suburban stations by code or name."""
    res = client.get(f"/api/stations/search?q={query}")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    codes = [s["code"] for s in data]
    assert expected_code in codes

def test_western_line_routes():
    """Verify Western Line route searches and reverse direction."""
    # Churchgate -> Virar
    r1 = client.get("/api/trains/search?from_station=CCG&to_station=VR")
    assert r1.status_code == 200
    assert r1.json()["count"] >= 1
    assert any("90001" in t["number"] for t in r1.json()["trains"])

    # Intermediate: Andheri -> Borivali
    r2 = client.get("/api/trains/search?from_station=ADH&to_station=BVI")
    assert r2.status_code == 200
    assert r2.json()["count"] >= 1

    # Reverse: Virar -> Churchgate
    r3 = client.get("/api/trains/search?from_station=VR&to_station=CCG")
    assert r3.status_code == 200
    assert r3.json()["count"] >= 1
    assert any("90002" in t["number"] for t in r3.json()["trains"])

def test_central_main_routes():
    """Verify Central Main Line route searches and reverse direction."""
    # CSMT -> Kalyan
    r1 = client.get("/api/trains/search?from_station=CSMT&to_station=KYN")
    assert r1.status_code == 200
    assert r1.json()["count"] >= 1

    # Intermediate: Thane -> Kalyan
    r2 = client.get("/api/trains/search?from_station=TNA&to_station=KYN")
    assert r2.status_code == 200
    assert r2.json()["count"] >= 1

    # Reverse: Kalyan -> CSMT
    r3 = client.get("/api/trains/search?from_station=KYN&to_station=CSMT")
    assert r3.status_code == 200
    assert r3.json()["count"] >= 1

def test_central_extensions_kasara_karjat_khopoli():
    """Verify Kalyan-Kasara, Kalyan-Karjat, and Karjat-Khopoli routes."""
    # Kalyan -> Kasara & reverse
    r_kasara = client.get("/api/trains/search?from_station=KYN&to_station=KSRA")
    assert r_kasara.status_code == 200
    assert r_kasara.json()["count"] >= 1

    r_kasara_rev = client.get("/api/trains/search?from_station=KSRA&to_station=KYN")
    assert r_kasara_rev.status_code == 200
    assert r_kasara_rev.json()["count"] >= 1

    # Kalyan -> Karjat & reverse
    r_karjat = client.get("/api/trains/search?from_station=KYN&to_station=KJT")
    assert r_karjat.status_code == 200
    assert r_karjat.json()["count"] >= 1

    r_karjat_rev = client.get("/api/trains/search?from_station=KJT&to_station=KYN")
    assert r_karjat_rev.status_code == 200
    assert r_karjat_rev.json()["count"] >= 1

    # Karjat -> Khopoli & reverse
    r_khopoli = client.get("/api/trains/search?from_station=KJT&to_station=KHPI")
    assert r_khopoli.status_code == 200
    assert r_khopoli.json()["count"] >= 1

    r_khopoli_rev = client.get("/api/trains/search?from_station=KHPI&to_station=KJT")
    assert r_khopoli_rev.status_code == 200
    assert r_khopoli_rev.json()["count"] >= 1

def test_harbour_line_routes():
    """Verify Harbour Line CSMT <-> Panvel routes."""
    r1 = client.get("/api/trains/search?from_station=CSMT&to_station=PNVL")
    assert r1.status_code == 200
    assert r1.json()["count"] >= 1

    r2 = client.get("/api/trains/search?from_station=PNVL&to_station=CSMT")
    assert r2.status_code == 200
    assert r2.json()["count"] >= 1

def test_trans_harbour_line_routes():
    """Verify Trans-Harbour Line Thane <-> Vashi and Thane <-> Nerul."""
    # Thane -> Vashi & reverse
    r1 = client.get("/api/trains/search?from_station=TNA&to_station=VSH")
    assert r1.status_code == 200
    assert r1.json()["count"] >= 1

    r2 = client.get("/api/trains/search?from_station=VSH&to_station=TNA")
    assert r2.status_code == 200
    assert r2.json()["count"] >= 1

    # Thane -> Nerul
    r3 = client.get("/api/trains/search?from_station=TNA&to_station=NEU")
    assert r3.status_code == 200
    assert r3.json()["count"] >= 1

def test_nerul_uran_corridor_routes():
    """Verify complete Nerul-Uran and Belapur-Uran corridor routes in both directions."""
    # Nerul -> Uran & reverse
    r_nu = client.get("/api/trains/search?from_station=NEU&to_station=URAN")
    assert r_nu.status_code == 200
    assert r_nu.json()["count"] >= 1

    r_un = client.get("/api/trains/search?from_station=URAN&to_station=NEU")
    assert r_un.status_code == 200
    assert r_un.json()["count"] >= 1

    # Seawoods-Darave -> Uran
    r_swu = client.get("/api/trains/search?from_station=SWDV&to_station=URAN")
    assert r_swu.status_code == 200
    assert r_swu.json()["count"] >= 1

    # CBD Belapur -> Uran
    r_bu = client.get("/api/trains/search?from_station=BEPR&to_station=URAN")
    assert r_bu.status_code == 200
    assert r_bu.json()["count"] >= 1

    # Kharkopar -> Uran & reverse
    r_ku = client.get("/api/trains/search?from_station=KARP&to_station=URAN")
    assert r_ku.status_code == 200
    assert r_ku.json()["count"] >= 1

    r_uk = client.get("/api/trains/search?from_station=URAN&to_station=KARP")
    assert r_uk.status_code == 200
    assert r_uk.json()["count"] >= 1

def test_preserved_existing_features_and_mmct_pune():
    """Verify existing MMCT -> PUNE search with class ALL continues working flawlessly."""
    res = client.get("/api/trains/search?from_station=MMCT&to_station=PUNE&class_type=ALL")
    assert res.status_code == 200
    assert res.json()["count"] >= 2
    train_nums = [t["number"] for t in res.json()["trains"]]
    assert "12127" in train_nums
    assert "22225" in train_nums
