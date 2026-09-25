import os
import csv
from typing import Dict, List, Tuple, Any

def load_and_validate_csv_stations(csv_path: str = None) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
    """
    Reads, validates, and cleans the Indian Railway stations CSV.
    Returns:
        (valid_stations, stats_dict)
    where stats_dict has 'total_rows', 'imported', 'duplicates', 'rejected'
    """
    if not csv_path:
        # Search candidate paths
        candidates = [
            os.path.join(os.path.dirname(__file__), "..", "..", "data", "indian_railway_stations_list.csv"),
            os.path.join(os.path.dirname(__file__), "..", "..", "data", "indian_railway_stations_list (1).csv"),
            r"C:\Users\Manish Gharat\Downloads\indian_railway_stations_list (1).csv",
            r"C:\Users\Manish Gharat\Downloads\indian_railway_stations_list.csv",
        ]
        for c in candidates:
            if os.path.exists(c):
                csv_path = c
                break

    if not csv_path or not os.path.exists(csv_path):
        raise FileNotFoundError(f"Could not find railway stations CSV at candidates: {candidates}")

    stats = {
        "csv_path": csv_path,
        "total_rows": 0,
        "imported": 0,
        "duplicates": 0,
        "rejected": 0,
        "rejected_reasons": []
    }

    valid_stations = []
    seen_codes = set()

    with open(csv_path, mode="r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row_num, row in enumerate(reader, start=2):
            stats["total_rows"] += 1
            raw_name = row.get("Station Name") or row.get("station_name") or ""
            raw_code = row.get("Station Code") or row.get("station_code") or ""
            raw_state = row.get("State") or row.get("state") or ""
            raw_zone = row.get("Railway Zone") or row.get("railway_zone") or ""

            name = raw_name.strip()
            code = raw_code.strip().upper()
            state = raw_state.strip()
            zone = raw_zone.strip()

            # Validation
            if not name:
                stats["rejected"] += 1
                stats["rejected_reasons"].append(f"Row {row_num}: Station Name is empty")
                continue
            if not code:
                stats["rejected"] += 1
                stats["rejected_reasons"].append(f"Row {row_num}: Station Code is empty")
                continue
            if not state:
                stats["rejected"] += 1
                stats["rejected_reasons"].append(f"Row {row_num}: State is empty")
                continue
            if not zone:
                stats["rejected"] += 1
                stats["rejected_reasons"].append(f"Row {row_num}: Railway Zone is empty")
                continue

            # Duplicate check
            if code in seen_codes:
                stats["duplicates"] += 1
                continue

            seen_codes.add(code)

            # Derive city from name if needed
            city = name.split(" Junction")[0].split(" Jn")[0].split(" Central")[0].split(" Terminus")[0].split(" Cantt")[0].split(" (")[0].strip()

            valid_stations.append({
                "name": name,
                "code": code,
                "city": city,
                "state": state,
                "zone": zone,
                "division": zone.split("(")[-1].replace(")", "").strip() if "(" in zone else zone,
                "search_aliases": f"{name.lower()}, {code.lower()}, {city.lower()}",
                "is_active": True,
                "is_junction": "Junction" in name or "Jn" in name,
                "is_major": True,
                "platform_count": 8 if "Central" in name or "Terminus" in name else 4,
                "latitude": 20.0,
                "longitude": 78.0,
            })
            stats["imported"] += 1

    return valid_stations, stats

if __name__ == "__main__":
    stations, stats = load_and_validate_csv_stations()
    print("CSV Validation Report:")
    print(f"Path: {stats['csv_path']}")
    print(f"Total Rows: {stats['total_rows']}")
    print(f"Imported (Valid Unique): {stats['imported']}")
    print(f"Duplicates: {stats['duplicates']}")
    print(f"Rejected: {stats['rejected']}")
    if stats["rejected_reasons"]:
        print(f"Rejected Reasons: {stats['rejected_reasons']}")
