import json
from datetime import datetime, timedelta
import random
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash, get_mpin_hash
from app.seed.stations_data import STATIONS_MASTER
from app.seed.import_csv_stations import load_and_validate_csv_stations
from app.seed.mumbai_suburban_data import MUMBAI_SUBURBAN_STATIONS, get_mumbai_suburban_trains_spec
from app.models import (
    User, Passenger, Station, Train, TrainSchedule, Coach, Seat,
    Booking, BookingPassenger, Payment, PNRRecord, UnreservedTicket,
    FoodVendor, FoodItem, FoodOrder, FoodOrderItem, Complaint,
    ComplaintAttachment, Refund, Wallet, WalletTransaction, Notification
)

def seed(reset: bool = True):
    if reset:
        try:
            Base.metadata.drop_all(bind=engine)
        except Exception as e:
            print(f"Resetting tables: {e}")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding Master Stations from CSV and Master Data...")
    csv_stations, stats = load_and_validate_csv_stations()
    print(f"Loaded {stats['imported']} valid stations from CSV (Duplicates: {stats['duplicates']}, Rejected: {stats['rejected']})")

    existing_stations = {s.code: s for s in db.query(Station).all()}
    stations = dict(existing_stations)
    seen_codes = set(existing_stations.keys())

    # 1. Seed from CSV (official 50 records)
    for s in csv_stations:
        code = s["code"].upper()
        if code in seen_codes:
            continue
        seen_codes.add(code)
        # Check if master has coordinates or richer aliases
        master_match = next((m for m in STATIONS_MASTER if m["code"].upper() == code), None)
        st = Station(
            code=code,
            name=s["name"],
            city=master_match["city"] if master_match else s["city"],
            state=s["state"],
            zone=s["zone"],
            division=master_match.get("division", s.get("division", "")) if master_match else s.get("division", ""),
            search_aliases=(master_match.get("search_aliases", "") + ", " + s.get("search_aliases", "")).strip(", ") if master_match else s.get("search_aliases", ""),
            is_active=True,
            is_junction=master_match.get("is_junction", s.get("is_junction", False)) if master_match else s.get("is_junction", False),
            is_major=True,
            platform_count=master_match.get("platform_count", s.get("platform_count", 6)) if master_match else s.get("platform_count", 6),
            latitude=master_match.get("latitude", 20.0) if master_match else 20.0,
            longitude=master_match.get("longitude", 78.0) if master_match else 78.0,
        )
        db.add(st)
        db.flush()
        stations[code] = st

    # 2. Seed remaining stations from STATIONS_MASTER (intermediate stops)
    for s in STATIONS_MASTER:
        code = s["code"].upper()
        if code in seen_codes:
            continue
        seen_codes.add(code)
        st = Station(
            code=code,
            name=s["name"],
            city=s["city"],
            state=s["state"],
            zone=s.get("zone", "NR"),
            division=s.get("division", ""),
            search_aliases=s.get("search_aliases", ""),
            is_active=s.get("is_active", True),
            is_junction=s.get("is_junction", False),
            is_major=s.get("is_major", False),
            platform_count=s.get("platform_count", 5),
            latitude=s.get("latitude", 19.0),
            longitude=s.get("longitude", 72.8),
        )
        db.add(st)
        db.flush()
        stations[code] = st

    # 3. Seed / Enrich Mumbai Suburban Railway Network
    print("Seeding Complete Mumbai Suburban Railway Network...")
    suburban_reused = 0
    suburban_added = 0
    duplicates_prevented = 0

    for sub in MUMBAI_SUBURBAN_STATIONS:
        code = sub["code"].upper()
        if code in seen_codes:
            # Re-use canonical record and enrich it with suburban corridor metadata!
            duplicates_prevented += 1
            existing_st = stations[code]
            existing_st.station_type = "SUBURBAN"
            if sub.get("district"):
                existing_st.district = sub["district"]
            # Merge corridors
            if existing_st.corridors:
                existing_corridors = set([c.strip() for c in existing_st.corridors.split(",") if c.strip()])
                new_corridors = set([c.strip() for c in sub.get("corridors", "").split(",") if c.strip()])
                existing_st.corridors = ", ".join(sorted(existing_corridors | new_corridors))
            else:
                existing_st.corridors = sub.get("corridors", "")
            # Merge search aliases
            existing_aliases = set([a.strip().lower() for a in (existing_st.search_aliases or "").split(",") if a.strip()])
            new_aliases = set([a.strip().lower() for a in sub.get("search_aliases", "").split(",") if a.strip()])
            existing_st.search_aliases = ", ".join(sorted(existing_aliases | new_aliases))
            suburban_reused += 1
            continue

        seen_codes.add(code)
        st = Station(
            code=code,
            name=sub["name"],
            city=sub["city"],
            state=sub.get("state", "Maharashtra"),
            zone=sub.get("zone", "CR"),
            division=sub.get("division", "Mumbai CR"),
            district=sub.get("district", "Mumbai Suburban"),
            station_type="SUBURBAN",
            corridors=sub.get("corridors", ""),
            search_aliases=sub.get("search_aliases", ""),
            is_active=True,
            is_junction=sub.get("is_junction", False),
            is_major=sub.get("is_major", False),
            platform_count=sub.get("platform_count", 4),
            latitude=sub.get("latitude", 19.0),
            longitude=sub.get("longitude", 72.8),
        )
        db.add(st)
        db.flush()
        stations[code] = st
        suburban_added += 1

    print(f"Mumbai Suburban integration: {suburban_added} new stations added, {suburban_reused} existing stations reused/enriched, {duplicates_prevented} duplicate records prevented.")
    print(f"Total seeded stations: {len(stations)} ({stats['imported']} from CSV + {len(stations) - stats['imported']} routes/suburban/intermediate stops).")

    print("Seeding Users...")
    existing_users = {u.email: u for u in db.query(User).all()}

    demo_user = existing_users.get("demo@railmate.com")
    if not demo_user:
        demo_user = User(
            email="demo@railmate.com",
            mobile="+919876543210",
            full_name="Manali Manish Gharat",
            hashed_password=get_password_hash("password123"),
            hashed_mpin=get_mpin_hash("123456"),
            mpin_enabled=True,
            mpin_failed_attempts=0,
            biometric_enabled=False,
            is_phone_verified=True,
            role="user",
            dob="1995-08-14",
            gender="Female",
            address="Bandra West, Mumbai, Maharashtra 400050",
            profile_completion=85,
            is_active=True
        )
        db.add(demo_user)
        db.flush()

        # Pre-add saved passengers for demo user
        passengers = [
            Passenger(user_id=demo_user.id, name="Manali Gharat", age=29, gender="Female", berth_preference="Lower", id_type="Aadhaar", id_number="XXXX-XXXX-4512", meal_preference="Veg"),
            Passenger(user_id=demo_user.id, name="Manish Gharat", age=32, gender="Male", berth_preference="Side Lower", id_type="Aadhaar", id_number="XXXX-XXXX-8901", meal_preference="Non-Veg"),
            Passenger(user_id=demo_user.id, name="Aarav Gharat", age=5, gender="Male", berth_preference="No Preference", id_type="None", id_number="", meal_preference="Veg")
        ]
        db.add_all(passengers)
        db.flush()

        # R-Wallet setup with initial balance
        demo_wallet = Wallet(user_id=demo_user.id, balance=2500.0)
        db.add(demo_wallet)
        db.flush()

        transactions = [
            WalletTransaction(wallet_id=demo_wallet.id, user_id=demo_user.id, transaction_type="CREDIT", amount=3000.0, reference="TXN-INIT-901", description="Initial Wallet Top-up (UPI)"),
            WalletTransaction(wallet_id=demo_wallet.id, user_id=demo_user.id, transaction_type="DEBIT", amount=500.0, reference="TXN-DEB-102", description="Platform Tickets & Refreshments"),
        ]
        db.add_all(transactions)

    demo_railone = existing_users.get("demo@railone.com")
    if not demo_railone:
        demo_railone = User(
            email="demo@railone.com",
            mobile="+919876543211",
            full_name="Manali Manish Gharat",
            hashed_password=get_password_hash("password123"),
            hashed_mpin=get_mpin_hash("123456"),
            mpin_enabled=True,
            mpin_failed_attempts=0,
            biometric_enabled=False,
            is_phone_verified=True,
            role="user",
            dob="1995-08-14",
            gender="Female",
            address="Bandra West, Mumbai, Maharashtra 400050",
            profile_completion=85,
            is_active=True
        )
        db.add(demo_railone)
        db.flush()

    admin_user = existing_users.get("admin@railmate.com")
    if not admin_user:
        admin_user = User(
            email="admin@railmate.com",
            mobile="+919998887770",
            full_name="RailOne Admin",
            hashed_password=get_password_hash("adminpassword123"),
            role="admin",
            is_phone_verified=True,
            dob="1988-04-12",
            gender="Male",
            address="Railway Bhavan, New Delhi 110001",
            profile_completion=100,
            is_active=True
        )
        db.add(admin_user)
        db.flush()

    print("Seeding 32 Trains & Schedules...")
    trains_spec = [
        # Mumbai to Delhi Corridor
        ("12951", "Mumbai Rajdhani Express", "Rajdhani", "MMCT", "NDLS", "17:00", "08:32", 15.5, "1,2,3,4,5,6,7", "1A,2A,3A,3E",
         [("MMCT", 0, "17:00", "17:00", 0, 1, 0), ("BVI", 1, "17:22", "17:24", 2, 1, 30), ("ST", 2, "19:43", "19:48", 5, 1, 263), ("BRC", 3, "21:06", "21:16", 10, 1, 392), ("RTM", 4, "00:02", "00:05", 3, 2, 653), ("KOTA", 5, "03:15", "03:20", 5, 2, 920), ("NDLS", 6, "08:32", "08:32", 0, 2, 1384)]),
        ("12952", "New Delhi - Mumbai Rajdhani", "Rajdhani", "NDLS", "MMCT", "16:55", "08:35", 15.6, "1,2,3,4,5,6,7", "1A,2A,3A,3E",
         [("NDLS", 0, "16:55", "16:55", 0, 1, 0), ("KOTA", 1, "21:30", "21:35", 5, 1, 464), ("RTM", 2, "00:35", "00:38", 3, 2, 731), ("BRC", 3, "03:45", "03:55", 10, 2, 992), ("ST", 4, "05:18", "05:23", 5, 2, 1121), ("BVI", 5, "07:40", "07:42", 2, 2, 1354), ("MMCT", 6, "08:35", "08:35", 0, 2, 1384)]),
        ("12953", "August Kranti Tejas Rajdhani", "Tejas Express", "MMCT", "NDLS", "17:10", "09:43", 16.5, "1,2,3,4,5,6,7", "1A,2A,3A",
         [("MMCT", 0, "17:10", "17:10", 0, 1, 0), ("BVI", 1, "17:33", "17:35", 2, 1, 30), ("VAPI", 2, "19:04", "19:06", 2, 1, 168), ("ST", 3, "20:50", "20:55", 5, 1, 263), ("BRC", 4, "22:19", "22:29", 10, 1, 392), ("RTM", 5, "01:50", "01:53", 3, 2, 653), ("KOTA", 6, "05:10", "05:15", 5, 2, 920), ("MTJ", 7, "07:58", "08:00", 2, 2, 1243), ("NDLS", 8, "09:43", "09:43", 0, 2, 1384)]),
        ("22221", "Mumbai CSMT - NZM Rajdhani", "Rajdhani", "CSMT", "NDLS", "16:10", "09:55", 17.7, "1,3,4,6", "1A,2A,3A",
         [("CSMT", 0, "16:10", "16:10", 0, 1, 0), ("KYN", 1, "16:43", "16:45", 2, 1, 54), ("NK", 2, "19:18", "19:20", 2, 1, 187), ("JL", 3, "22:28", "22:30", 2, 1, 417), ("BSL", 4, "23:00", "23:05", 5, 1, 441), ("BPL", 5, "05:00", "05:05", 5, 2, 836), ("VGLJ", 6, "08:30", "08:35", 5, 2, 1128), ("GWL", 7, "09:40", "09:42", 2, 2, 1226), ("AGC", 8, "11:15", "11:17", 2, 2, 1344), ("NDLS", 9, "09:55", "09:55", 0, 2, 1540)]),
        
        # Mumbai to Ahmedabad
        ("20901", "Mumbai - Gandhinagar Vande Bharat", "Vande Bharat", "MMCT", "ADI", "06:00", "11:25", 5.4, "1,2,3,4,5,6", "CC,EC",
         [("MMCT", 0, "06:00", "06:00", 0, 1, 0), ("BVI", 1, "06:23", "06:25", 2, 1, 30), ("VAPI", 2, "07:56", "07:58", 2, 1, 168), ("ST", 3, "08:37", "08:40", 3, 1, 263), ("BH", 4, "09:22", "09:24", 2, 1, 322), ("BRC", 5, "10:00", "10:05", 5, 1, 392), ("ANND", 6, "10:35", "10:37", 2, 1, 427), ("ADI", 7, "11:25", "11:30", 5, 1, 492)]),
        ("20902", "Gandhinagar - Mumbai Vande Bharat", "Vande Bharat", "ADI", "MMCT", "15:00", "20:25", 5.4, "1,2,3,4,5,6", "CC,EC",
         [("ADI", 0, "15:00", "15:00", 0, 1, 0), ("ANND", 1, "15:40", "15:42", 2, 1, 65), ("BRC", 2, "16:15", "16:20", 5, 1, 100), ("BH", 3, "16:55", "16:57", 2, 1, 170), ("ST", 4, "17:43", "17:46", 3, 1, 229), ("VAPI", 5, "18:38", "18:40", 2, 1, 324), ("BVI", 6, "19:32", "19:34", 2, 1, 462), ("MMCT", 7, "20:25", "20:25", 0, 1, 492)]),
        ("12009", "Mumbai - Ahmedabad Shatabdi", "Shatabdi", "MMCT", "ADI", "06:20", "12:45", 6.4, "1,2,3,4,5,6", "CC,EC",
         [("MMCT", 0, "06:20", "06:20", 0, 1, 0), ("BVI", 1, "06:48", "06:50", 2, 1, 30), ("VAPI", 2, "08:14", "08:16", 2, 1, 168), ("ST", 3, "09:15", "09:18", 3, 1, 263), ("BH", 4, "10:00", "10:02", 2, 1, 322), ("BRC", 5, "10:45", "10:50", 5, 1, 392), ("ANND", 6, "11:20", "11:22", 2, 1, 427), ("ADI", 7, "12:45", "12:45", 0, 1, 492)]),
        ("12267", "Mumbai - Ahmedabad Duronto", "Duronto", "MMCT", "ADI", "23:25", "05:55", 6.5, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("MMCT", 0, "23:25", "23:25", 0, 1, 0), ("ADI", 1, "05:55", "05:55", 0, 2, 492)]),

        # Mumbai to Pune
        ("12123", "Deccan Queen Superfast", "Superfast", "CSMT", "PUNE", "17:10", "20:25", 3.2, "1,2,3,4,5,6,7", "CC,2S",
         [("CSMT", 0, "17:10", "17:10", 0, 1, 0), ("DR", 1, "17:20", "17:22", 2, 1, 9), ("TNA", 2, "17:40", "17:42", 2, 1, 34), ("KYN", 3, "18:02", "18:05", 3, 1, 54), ("LNL", 4, "19:18", "19:20", 2, 1, 128), ("SVJR", 5, "20:09", "20:10", 1, 1, 190), ("PUNE", 6, "20:25", "20:25", 0, 1, 192)]),
        ("12124", "Deccan Queen Return", "Superfast", "PUNE", "CSMT", "07:15", "10:25", 3.1, "1,2,3,4,5,6,7", "CC,2S",
         [("PUNE", 0, "07:15", "07:15", 0, 1, 0), ("SVJR", 1, "07:22", "07:23", 1, 1, 2), ("LNL", 2, "08:14", "08:15", 1, 1, 64), ("KYN", 3, "09:18", "09:20", 2, 1, 138), ("TNA", 4, "09:40", "09:42", 2, 1, 158), ("DR", 5, "10:03", "10:05", 2, 1, 183), ("CSMT", 6, "10:25", "10:25", 0, 1, 192)]),
        ("12127", "Mumbai Central - Pune Intercity SF", "Superfast", "MMCT", "PUNE", "06:40", "09:57", 3.3, "1,2,3,4,5,6,7", "CC,2S",
         [("MMCT", 0, "06:40", "06:40", 0, 1, 0), ("DR", 1, "06:55", "06:57", 2, 1, 6), ("TNA", 2, "07:18", "07:20", 2, 1, 31), ("KYN", 3, "07:38", "07:40", 2, 1, 51), ("LNL", 4, "08:58", "09:00", 2, 1, 125), ("SVJR", 5, "09:44", "09:45", 1, 1, 187), ("PUNE", 6, "09:57", "09:57", 0, 1, 189)]),
        ("12128", "Pune - Mumbai Central Intercity SF", "Superfast", "PUNE", "MMCT", "17:55", "21:05", 3.2, "1,2,3,4,5,6,7", "CC,2S",
         [("PUNE", 0, "17:55", "17:55", 0, 1, 0), ("SVJR", 1, "18:02", "18:03", 1, 1, 2), ("LNL", 2, "18:54", "18:55", 1, 1, 64), ("KYN", 3, "19:58", "20:00", 2, 1, 138), ("TNA", 4, "20:20", "20:22", 2, 1, 158), ("DR", 5, "20:43", "20:45", 2, 1, 183), ("MMCT", 6, "21:05", "21:05", 0, 1, 189)]),
        ("22225", "Mumbai Central - Solapur Vande Bharat", "Vande Bharat", "MMCT", "PUNE", "16:05", "19:10", 3.1, "1,2,3,4,5,7", "CC,EC",
         [("MMCT", 0, "16:05", "16:05", 0, 1, 0), ("DR", 1, "16:17", "16:20", 3, 1, 6), ("KYN", 2, "16:53", "16:55", 2, 1, 51), ("PUNE", 3, "19:10", "19:15", 5, 1, 189)]),
        ("22226", "Solapur - Mumbai Central Vande Bharat", "Vande Bharat", "PUNE", "MMCT", "09:15", "12:35", 3.3, "1,2,3,4,5,7", "CC,EC",
         [("PUNE", 0, "09:15", "09:20", 5, 1, 0), ("KYN", 1, "11:33", "11:35", 2, 1, 138), ("DR", 2, "12:08", "12:10", 2, 1, 183), ("MMCT", 3, "12:35", "12:35", 0, 1, 189)]),
        ("22105", "Indrayani Express", "Express", "CSMT", "PUNE", "05:40", "09:05", 3.4, "1,2,3,4,5,6,7", "CC,2S",
         [("CSMT", 0, "05:40", "05:40", 0, 1, 0), ("DR", 1, "05:51", "05:53", 2, 1, 9), ("TNA", 2, "06:14", "06:16", 2, 1, 34), ("KYN", 3, "06:33", "06:35", 2, 1, 54), ("KJT", 4, "07:13", "07:15", 2, 1, 100), ("LNL", 5, "07:58", "08:00", 2, 1, 128), ("SVJR", 6, "08:49", "08:50", 1, 1, 190), ("PUNE", 7, "09:05", "09:05", 0, 1, 192)]),

        # Mumbai to Howrah / Nagpur
        ("12859", "Gitanjali Express", "Superfast", "CSMT", "HWH", "06:00", "12:30", 30.5, "1,2,3,4,5,6,7", "2A,3A,SL,2S",
         [("CSMT", 0, "06:00", "06:00", 0, 1, 0), ("DR", 1, "06:12", "06:15", 3, 1, 9), ("KYN", 2, "06:52", "06:55", 3, 1, 54), ("IGP", 3, "08:43", "08:45", 2, 1, 137), ("NK", 4, "09:30", "09:35", 5, 1, 187), ("JL", 5, "11:58", "12:00", 2, 1, 417), ("BSL", 6, "12:40", "12:45", 5, 1, 441), ("AK", 7, "14:40", "14:45", 5, 1, 586), ("BD", 8, "16:00", "16:05", 5, 1, 665), ("WR", 9, "17:18", "17:20", 2, 1, 760), ("NGP", 10, "18:55", "19:00", 5, 1, 837), ("R", 11, "23:25", "23:30", 5, 1, 1140), ("BSP", 12, "01:20", "01:35", 15, 2, 1251), ("KGP", 13, "09:40", "09:45", 5, 2, 1853), ("HWH", 14, "12:30", "12:30", 0, 2, 1968)]),
        ("12289", "Mumbai CSMT - Nagpur Duronto", "Duronto", "CSMT", "NGP", "20:15", "07:20", 11.0, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("CSMT", 0, "20:15", "20:15", 0, 1, 0), ("IGP", 1, "22:50", "22:55", 5, 1, 137), ("BSL", 2, "02:40", "02:45", 5, 2, 441), ("NGP", 3, "07:20", "07:20", 0, 2, 837)]),
        ("12137", "Punjab Mail", "Express", "CSMT", "NDLS", "19:35", "19:10", 23.5, "1,2,3,4,5,6,7", "1A,2A,3A,SL,2S",
         [("CSMT", 0, "19:35", "19:35", 0, 1, 0), ("DR", 1, "19:47", "19:50", 3, 1, 9), ("KYN", 2, "20:32", "20:35", 3, 1, 54), ("NK", 3, "23:10", "23:15", 5, 1, 187), ("JL", 4, "01:58", "02:00", 2, 2, 417), ("BSL", 5, "02:35", "02:40", 5, 2, 441), ("ET", 6, "07:50", "08:00", 10, 2, 748), ("BPL", 7, "09:30", "09:35", 5, 2, 840), ("VGLJ", 8, "13:30", "13:38", 8, 2, 1132), ("GWL", 9, "14:40", "14:42", 2, 2, 1230), ("AGC", 10, "16:15", "16:20", 5, 2, 1348), ("MTJ", 11, "17:00", "17:05", 5, 2, 1402), ("FDB", 12, "18:25", "18:27", 2, 2, 1510), ("NDLS", 13, "19:10", "19:10", 0, 2, 1540)]),

        # Mumbai to Bengaluru & Chennai
        ("11301", "Udyan Express", "Express", "CSMT", "SBC", "08:10", "07:45", 23.5, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("CSMT", 0, "08:10", "08:10", 0, 1, 0), ("DR", 1, "08:22", "08:25", 3, 1, 9), ("TNA", 2, "08:48", "08:50", 2, 1, 34), ("KYN", 3, "09:12", "09:15", 3, 1, 54), ("LNL", 4, "10:38", "10:40", 2, 1, 128), ("PUNE", 5, "11:50", "11:55", 5, 1, 192), ("DD", 6, "13:13", "13:15", 2, 1, 268), ("KWV", 7, "14:33", "14:35", 2, 1, 377), ("SUR", 8, "15:40", "15:45", 5, 1, 456), ("KLBG", 9, "17:32", "17:35", 3, 1, 569), ("WADI", 10, "18:30", "18:35", 5, 1, 606), ("RC", 11, "20:13", "20:15", 2, 1, 714), ("GTL", 12, "22:20", "22:25", 5, 1, 835), ("SBC", 13, "07:45", "07:45", 0, 2, 1136)]),
        ("12163", "Mumbai LTT - Chennai Superfast", "Superfast", "CSMT", "MAS", "18:45", "16:20", 21.5, "1,2,3,4,5,6,7", "2A,3A,SL",
         [("CSMT", 0, "18:45", "18:45", 0, 1, 0), ("DR", 1, "18:57", "19:00", 3, 1, 9), ("TNA", 2, "19:23", "19:25", 2, 1, 34), ("KYN", 3, "19:47", "19:50", 3, 1, 54), ("PUNE", 4, "22:10", "22:15", 5, 1, 192), ("SUR", 5, "01:50", "01:55", 5, 2, 456), ("WADI", 6, "04:15", "04:20", 5, 2, 606), ("GTL", 7, "07:40", "07:45", 5, 2, 835), ("RU", 8, "12:15", "12:20", 5, 2, 1146), ("MAS", 9, "16:20", "16:20", 0, 2, 1281)]),

        # Delhi to Bengaluru, Chennai, Kolkata
        ("12627", "Karnataka Express", "Superfast", "NDLS", "SBC", "20:20", "12:00", 39.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("NDLS", 0, "20:20", "20:20", 0, 1, 0), ("AGC", 1, "22:50", "22:55", 5, 1, 195), ("GWL", 2, "00:18", "00:20", 2, 2, 313), ("VGLJ", 3, "01:40", "01:48", 8, 2, 411), ("BPL", 4, "05:30", "05:35", 5, 2, 703), ("ET", 5, "07:10", "07:20", 10, 2, 795), ("NGP", 6, "12:20", "12:25", 5, 2, 1091), ("BPQ", 7, "15:40", "15:45", 5, 2, 1300), ("KZJ", 8, "18:28", "18:30", 2, 2, 1535), ("SC", 9, "20:40", "20:45", 5, 2, 1672), ("GTL", 10, "03:40", "03:45", 5, 3, 2095), ("SBC", 11, "12:00", "12:00", 0, 3, 2408)]),
        ("12626", "Kerala Express", "Superfast", "NDLS", "MAS", "20:10", "04:30", 32.3, "1,2,3,4,5,6,7", "2A,3A,SL",
         [("NDLS", 0, "20:10", "20:10", 0, 1, 0), ("AGC", 1, "22:20", "22:25", 5, 1, 195), ("GWL", 2, "23:43", "23:45", 2, 1, 313), ("VGLJ", 3, "01:05", "01:13", 8, 2, 411), ("BPL", 4, "05:00", "05:05", 5, 2, 703), ("ET", 5, "06:40", "06:45", 5, 2, 795), ("NGP", 6, "11:45", "11:50", 5, 2, 1091), ("BPQ", 7, "15:00", "15:05", 5, 2, 1300), ("BZA", 8, "21:30", "21:40", 10, 2, 1753), ("MAS", 9, "04:30", "04:30", 0, 3, 2182)]),
        ("12301", "Howrah Rajdhani Express", "Rajdhani", "HWH", "NDLS", "16:50", "10:05", 17.2, "1,2,3,4,5,7", "1A,2A,3A",
         [("HWH", 0, "16:50", "16:50", 0, 1, 0), ("BWN", 1, "17:50", "17:52", 2, 1, 95), ("DGR", 2, "18:38", "18:40", 2, 1, 158), ("ASN", 3, "19:15", "19:20", 5, 1, 200), ("DDU", 4, "00:45", "00:55", 10, 2, 650), ("PRYJ", 5, "02:30", "02:35", 5, 2, 803), ("CNB", 6, "04:40", "04:45", 5, 2, 997), ("NDLS", 7, "10:05", "10:05", 0, 2, 1451)]),
        ("12302", "New Delhi - Howrah Rajdhani", "Rajdhani", "NDLS", "HWH", "16:55", "09:55", 17.0, "1,2,3,5,6,7", "1A,2A,3A",
         [("NDLS", 0, "16:55", "16:55", 0, 1, 0), ("CNB", 1, "21:32", "21:37", 5, 1, 435), ("PRYJ", 2, "23:43", "23:45", 2, 1, 629), ("DDU", 3, "01:42", "01:52", 10, 2, 782), ("ASN", 4, "06:50", "06:54", 4, 2, 1232), ("DGR", 5, "07:28", "07:30", 2, 2, 1274), ("BWN", 6, "08:24", "08:26", 2, 2, 1337), ("HWH", 7, "09:55", "09:55", 0, 2, 1451)]),
        ("22436", "Vande Bharat Express (NDLS-BSB)", "Vande Bharat", "NDLS", "JP", "06:00", "10:30", 4.5, "1,2,3,5,6,7", "CC,EC",
         [("NDLS", 0, "06:00", "06:00", 0, 1, 0), ("JP", 1, "10:30", "10:30", 0, 1, 308)]),

        # Chennai - Bengaluru - Hyderabad
        ("12007", "Chennai - Mysuru Shatabdi", "Shatabdi", "MAS", "SBC", "06:00", "10:55", 4.9, "1,3,4,5,6,7", "CC,EC",
         [("MAS", 0, "06:00", "06:00", 0, 1, 0), ("KPD", 1, "07:38", "07:40", 2, 1, 130), ("SBC", 2, "10:55", "11:00", 5, 1, 359)]),
        ("20607", "Chennai - Bengaluru Vande Bharat", "Vande Bharat", "MAS", "SBC", "05:50", "10:20", 4.5, "1,2,3,4,5,6", "CC,EC",
         [("MAS", 0, "05:50", "05:50", 0, 1, 0), ("KPD", 1, "07:13", "07:15", 2, 1, 130), ("SBC", 2, "10:20", "10:25", 5, 1, 359)]),
        ("12723", "Telangana Express", "Superfast", "SC", "NDLS", "06:00", "07:40", 25.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("SC", 0, "06:00", "06:00", 0, 1, 0), ("KZJ", 1, "07:48", "07:50", 2, 1, 132), ("BPQ", 2, "11:00", "11:05", 5, 1, 367), ("NGP", 3, "15:20", "15:25", 5, 1, 581), ("BPL", 4, "21:40", "21:45", 5, 1, 970), ("VGLJ", 5, "01:25", "01:30", 5, 2, 1262), ("GWL", 6, "02:40", "02:42", 2, 2, 1360), ("AGC", 7, "04:15", "04:17", 2, 2, 1478), ("NDLS", 8, "07:40", "07:40", 0, 2, 1672)]),
        ("12724", "Telangana Express Return", "Superfast", "NDLS", "SC", "16:00", "17:10", 25.1, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("NDLS", 0, "16:00", "16:00", 0, 1, 0), ("AGC", 1, "18:05", "18:07", 2, 1, 195), ("GWL", 2, "19:25", "19:27", 2, 1, 313), ("VGLJ", 3, "21:00", "21:05", 5, 1, 411), ("BPL", 4, "01:10", "01:15", 5, 2, 703), ("NGP", 5, "07:10", "07:15", 5, 2, 1091), ("BPQ", 6, "10:45", "10:50", 5, 2, 1305), ("KZJ", 7, "14:08", "14:10", 2, 2, 1540), ("SC", 8, "17:10", "17:10", 0, 2, 1672)]),

        # Mumbai to Jaipur & Rajasthan
        ("12955", "Mumbai Central - Jaipur Superfast", "Superfast", "MMCT", "JP", "19:05", "12:45", 17.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("MMCT", 0, "19:05", "19:05", 0, 1, 0), ("BVI", 1, "19:32", "19:34", 2, 1, 30), ("ST", 2, "22:30", "22:35", 5, 1, 263), ("BRC", 3, "00:08", "00:18", 10, 2, 392), ("RTM", 4, "04:00", "04:05", 5, 2, 653), ("KOTA", 5, "07:45", "07:55", 10, 2, 920), ("SWM", 6, "09:25", "09:40", 15, 2, 1028), ("JP", 7, "12:45", "12:45", 0, 2, 1159)]),
        ("12956", "Jaipur - Mumbai Central Superfast", "Superfast", "JP", "MMCT", "14:00", "07:40", 17.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("JP", 0, "14:00", "14:00", 0, 1, 0), ("SWM", 1, "15:40", "15:55", 15, 1, 131), ("KOTA", 2, "17:10", "17:20", 10, 1, 239), ("RTM", 3, "21:05", "21:15", 10, 1, 506), ("BRC", 4, "01:06", "01:16", 10, 2, 767), ("ST", 5, "03:00", "03:05", 5, 2, 896), ("BVI", 6, "06:33", "06:35", 2, 2, 1129), ("MMCT", 7, "07:40", "07:40", 0, 2, 1159)]),
        ("12979", "Bandra Terminus - Jaipur SF", "Superfast", "MMCT", "JP", "17:05", "10:30", 17.4, "2,4,6", "2A,3A,SL,2S",
         [("MMCT", 0, "17:05", "17:05", 0, 1, 0), ("BVI", 1, "17:37", "17:40", 3, 1, 30), ("VAPI", 2, "19:14", "19:16", 2, 1, 168), ("ST", 3, "20:35", "20:40", 5, 1, 263), ("BRC", 4, "22:28", "22:38", 10, 1, 392), ("KOTA", 5, "05:30", "05:40", 10, 2, 920), ("JP", 6, "10:30", "10:30", 0, 2, 1159)]),

        # Kolkata to South & West
        ("12841", "Coromandel Express", "Superfast", "HWH", "MAS", "15:20", "17:00", 25.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("HWH", 0, "15:20", "15:20", 0, 1, 0), ("KGP", 1, "17:00", "17:05", 5, 1, 115), ("BBS", 2, "21:50", "21:55", 5, 1, 437), ("VSKP", 3, "04:25", "04:45", 20, 2, 881), ("BZA", 4, "10:15", "10:25", 10, 2, 1231), ("MAS", 5, "17:00", "17:00", 0, 2, 1662)]),
        ("12842", "Coromandel Express Return", "Superfast", "MAS", "HWH", "07:00", "10:40", 27.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("MAS", 0, "07:00", "07:00", 0, 1, 0), ("BZA", 1, "12:55", "13:05", 10, 1, 431), ("VSKP", 2, "19:30", "19:50", 20, 1, 781), ("BBS", 3, "02:15", "02:20", 5, 2, 1225), ("KGP", 4, "06:30", "06:35", 5, 2, 1547), ("HWH", 5, "10:40", "10:40", 0, 2, 1662)]),
        ("12245", "Howrah - Yesvantpur Duronto", "Duronto", "HWH", "SBC", "10:50", "16:00", 29.1, "2,3,5,6,7", "1A,2A,3A,SL",
         [("HWH", 0, "10:50", "10:50", 0, 1, 0), ("BBS", 1, "16:20", "16:30", 10, 1, 437), ("BZA", 2, "04:15", "04:25", 10, 2, 1231), ("SBC", 3, "16:00", "16:00", 0, 2, 1946)]),
        ("12051", "Mumbai CSMT - Madgaon Jan Shatabdi", "Superfast", "CSMT", "PUNE", "05:10", "08:40", 3.5, "1,2,3,4,5,6,7", "CC,2S",
         [("CSMT", 0, "05:10", "05:10", 0, 1, 0), ("DR", 1, "05:21", "05:23", 2, 1, 9), ("TNA", 2, "05:43", "05:45", 2, 1, 34), ("KYN", 3, "06:03", "06:05", 2, 1, 54), ("PUNE", 4, "08:40", "08:40", 0, 1, 192)])
    ]

    suburban_trains = get_mumbai_suburban_trains_spec()
    trains_spec.extend(suburban_trains)
    print(f"Total Trains to seed: {len(trains_spec)} ({len(suburban_trains)} Mumbai Suburban EMU services + {len(trains_spec) - len(suburban_trains)} Long Distance services).")

    coach_templates = {
        "Suburban EMU": [
            ("ENG", "LOCO", "Platform Front"),
            ("GEN1", "2S", "Platform Zone A"),
            ("GEN2", "2S", "Platform Zone A"),
            ("FC1", "CC", "Platform Zone B"),
            ("GEN3", "2S", "Platform Zone B"),
            ("GEN4", "2S", "Platform Zone C"),
            ("FC2", "CC", "Platform Zone C"),
            ("GEN5", "2S", "Platform Zone D"),
            ("GEN6", "2S", "Platform Zone D"),
            ("ENG", "LOCO", "Platform Rear"),
        ],
        "Rajdhani": [
            ("ENG", "LOCO", "Platform Front"),
            ("EOG", "GEN", "Platform Zone A"),
            ("H1", "1A", "Platform Zone A"),
            ("A1", "2A", "Platform Zone A"),
            ("A2", "2A", "Platform Zone B"),
            ("B1", "3A", "Platform Zone B"),
            ("B2", "3A", "Platform Zone B"),
            ("B3", "3A", "Platform Zone C"),
            ("B4", "3A", "Platform Zone C"),
            ("B5", "3A", "Platform Zone C"),
            ("PC", "PANTRY", "Platform Zone D"),
            ("B6", "3A", "Platform Zone D"),
            ("EOG", "GEN", "Platform Rear"),
        ],
        "Vande Bharat": [
            ("ENG", "LOCO", "Platform Front"),
            ("C1", "CC", "Platform Zone A"),
            ("C2", "CC", "Platform Zone A"),
            ("C3", "CC", "Platform Zone B"),
            ("E1", "EC", "Platform Zone B"),
            ("C4", "CC", "Platform Zone C"),
            ("C5", "CC", "Platform Zone C"),
            ("C6", "CC", "Platform Zone D"),
            ("ENG", "LOCO", "Platform Rear"),
        ],
        "Superfast": [
            ("ENG", "LOCO", "Platform Front"),
            ("GEN1", "GEN", "Platform Zone A"),
            ("S1", "SL", "Platform Zone A"),
            ("S2", "SL", "Platform Zone B"),
            ("S3", "SL", "Platform Zone B"),
            ("S4", "SL", "Platform Zone B"),
            ("S5", "SL", "Platform Zone C"),
            ("S6", "SL", "Platform Zone C"),
            ("B1", "3A", "Platform Zone C"),
            ("B2", "3A", "Platform Zone D"),
            ("A1", "2A", "Platform Zone D"),
            ("GEN2", "GEN", "Platform Rear"),
        ]
    }

    berth_types = ["Lower", "Middle", "Upper", "Lower", "Middle", "Upper", "Side Lower", "Side Upper"]

    existing_trains = {t.number: t for t in db.query(Train).all()}
    created_trains = []
    for num, name, ttype, src, dst, dep, arr, dur, days, classes, stops in trains_spec:
        if num in existing_trains:
            created_trains.append(existing_trains[num])
            continue

        src_station = stations.get(src)
        dst_station = stations.get(dst)
        if not src_station or not dst_station:
            continue
        
        train = Train(
            number=num,
            name=name,
            train_type=ttype,
            source_station_id=src_station.id,
            destination_station_id=dst_station.id,
            departure_time=dep,
            arrival_time=arr,
            duration_hours=dur,
            running_days=days,
            available_classes=classes,
            is_active=True
        )
        db.add(train)
        db.flush()
        created_trains.append(train)

        # Schedules
        for st_code, seq, arr_t, dep_t, halt, day, dist in stops:
            station_obj = stations.get(st_code)
            if not station_obj:
                continue
            schedule = TrainSchedule(
                train_id=train.id,
                station_id=station_obj.id,
                stop_sequence=seq,
                arrival_time=arr_t,
                departure_time=dep_t,
                halt_minutes=halt,
                day_number=day,
                distance_km=dist,
                platform_number=random.randint(1, station_obj.platform_count)
            )
            db.add(schedule)

        # Coaches & Seats
        template = coach_templates.get(ttype, coach_templates["Superfast"])
        for idx, (c_code, c_type, zone) in enumerate(template):
            coach = Coach(
                train_id=train.id,
                coach_code=c_code,
                coach_type=c_type,
                sequence_order=idx + 1,
                total_seats=72 if c_type in ["SL", "3A"] else 54 if c_type == "2A" else 78,
                platform_zone=zone
            )
            db.add(coach)
            db.flush()

            # Create seats for non-loco/non-pantry coaches
            if c_type not in ["LOCO", "PANTRY", "GEN"]:
                for s_num in range(1, 25): # Seed 24 representative seats per coach
                    b_type = berth_types[(s_num - 1) % len(berth_types)]
                    seat = Seat(
                        coach_id=coach.id,
                        seat_number=s_num,
                        berth_type=b_type,
                        is_booked=random.choice([True, False, False])
                    )
                    db.add(seat)

    db.flush()

    if db.query(Booking).count() == 0 and len(created_trains) > 6:
        print("Seeding Sample Bookings & Payments...")
        sample_booking = Booking(
            booking_ref="BK-789124",
            user_id=demo_user.id,
            train_id=created_trains[0].id, # Mumbai Rajdhani
            from_station_id=stations["MMCT"].id,
            to_station_id=stations["NDLS"].id,
            journey_date=(datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            travel_class="3A",
            quota="General",
            status="CONFIRMED",
            pnr_number="8421098451",
            base_fare=2280.0,
            taxes=75.0,
            total_amount=2355.0,
            qr_code="RAILONE:PNR:8421098451:MMCT:NDLS:3A:CONFIRMED"
        )
        db.add(sample_booking)
        db.flush()

        bp1 = BookingPassenger(
            booking_id=sample_booking.id,
            name="Manali Manish Gharat",
            age=29,
            gender="Female",
            berth_preference="Lower",
            allocated_coach="B2",
            allocated_seat=45,
            allocated_berth_type="Lower",
            status="CNF"
        )
        bp2 = BookingPassenger(
            booking_id=sample_booking.id,
            name="Manish Gharat",
            age=32,
            gender="Male",
            berth_preference="Side Lower",
            allocated_coach="B2",
            allocated_seat=46,
            allocated_berth_type="Middle",
            status="CNF"
        )
        db.add_all([bp1, bp2])

        payment = Payment(
            booking_id=sample_booking.id,
            user_id=demo_user.id,
            amount=2355.0,
            payment_method="UPI",
            transaction_ref="TXN-UPI-98421045",
            status="SUCCESS"
        )
        db.add(payment)

        # 2nd completed booking
        past_booking = Booking(
            booking_ref="BK-102941",
            user_id=demo_user.id,
            train_id=created_trains[4].id, # Deccan Queen
            from_station_id=stations["CSMT"].id,
            to_station_id=stations["PUNE"].id,
            journey_date=(datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"),
            travel_class="CC",
            quota="General",
            status="COMPLETED",
            pnr_number="4521098420",
            base_fare=390.0,
            taxes=30.0,
            total_amount=420.0,
            qr_code="RAILONE:PNR:4521098420:CSMT:PUNE:CC:COMPLETED"
        )
        db.add(past_booking)
        db.flush()
        bp3 = BookingPassenger(booking_id=past_booking.id, name="Manali Manish Gharat", age=29, gender="Female", berth_preference="Window", allocated_coach="C1", allocated_seat=14, allocated_berth_type="Window", status="CNF")
        db.add(bp3)

        # 3rd cancelled booking
        cancelled_booking = Booking(
            booking_ref="BK-304918",
            user_id=demo_user.id,
            train_id=created_trains[6].id, # Mumbai - Ahmedabad Shatabdi
            from_station_id=stations["MMCT"].id,
            to_station_id=stations["ADI"].id,
            journey_date=(datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
            travel_class="CC",
            quota="General",
            status="CANCELLED",
            pnr_number="6521908412",
            base_fare=920.0,
            taxes=45.0,
            total_amount=965.0,
            qr_code="RAILONE:PNR:6521908412:MMCT:ADI:CC:CANCELLED"
        )
        db.add(cancelled_booking)
        db.flush()
        bp4 = BookingPassenger(booking_id=cancelled_booking.id, name="Manish Gharat", age=32, gender="Male", berth_preference="Aisle", allocated_coach="C3", allocated_seat=22, allocated_berth_type="Aisle", status="CAN")
        db.add(bp4)

        # Pre-add Refund for cancelled booking
        demo_refund = Refund(
            refund_ref="RF-849102",
            booking_id=cancelled_booking.id,
            user_id=demo_user.id,
            original_amount=965.0,
            cancellation_charge=120.0,
            refund_amount=845.0,
            reason="Travel plan changed",
            status="APPROVED"
        )
        db.add(demo_refund)

    print("Seeding 20+ Sample PNR Records...")
    existing_pnrs = {p.pnr_number for p in db.query(PNRRecord.pnr_number).all()}
    pnr_samples = [
        ("8421098451", "12951", "Mumbai Rajdhani Express", (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"), "Mumbai Central (MMCT)", "New Delhi (NDLS)", "Mumbai Central", "3A", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF B2-45 (Lower)"},
            {"passenger": "Passenger 2", "booking_status": "CNF", "current_status": "CNF B2-46 (Middle)"}
        ]),
        ("4521098420", "12123", "Deccan Queen Superfast", (datetime.now() - timedelta(days=12)).strftime("%Y-%m-%d"), "Mumbai CSMT (CSMT)", "Pune Jn (PUNE)", "Mumbai CSMT", "CC", "General", "CHART PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF C1-14 (Window)"}
        ]),
        ("6521908412", "12009", "Mumbai - Ahmedabad Shatabdi", (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"), "Mumbai Central (MMCT)", "Ahmedabad Jn (ADI)", "Mumbai Central", "CC", "General", "CHART PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CAN", "current_status": "CANCELLED"}
        ]),
        ("2451098734", "20901", "Mumbai - Gandhinagar Vande Bharat", (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"), "Mumbai Central (MMCT)", "Ahmedabad Jn (ADI)", "Mumbai Central", "CC", "General", "CHART PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF C2-21 (Window)"},
            {"passenger": "Passenger 2", "booking_status": "CNF", "current_status": "CNF C2-22 (Aisle)"}
        ]),
        ("1892049182", "12953", "August Kranti Tejas Rajdhani", (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"), "Mumbai Central (MMCT)", "New Delhi (NDLS)", "Mumbai Central", "2A", "Tatkal", "CHART PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "RAC 4", "current_status": "CNF A1-18 (Lower)"},
            {"passenger": "Passenger 2", "booking_status": "RAC 5", "current_status": "CNF A1-19 (Upper)"}
        ]),
        ("9018247192", "22221", "Mumbai CSMT - NZM Rajdhani", (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"), "Mumbai CSMT (CSMT)", "New Delhi (NDLS)", "Mumbai CSMT", "3A", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "WL 12", "current_status": "WL 4 (Confirmation: 85%)"}
        ]),
        ("3145928172", "12859", "Gitanjali Express", (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"), "Mumbai CSMT (CSMT)", "Howrah Jn (HWH)", "Mumbai CSMT", "SL", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF S4-15 (Lower)"},
            {"passenger": "Passenger 2", "booking_status": "CNF", "current_status": "CNF S4-18 (Side Lower)"}
        ]),
        ("4829104928", "12627", "Karnataka Express", (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"), "New Delhi (NDLS)", "KSR Bengaluru (SBC)", "New Delhi", "3A", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "RAC 12", "current_status": "RAC 2"}
        ]),
        ("7192840192", "12301", "Howrah Rajdhani Express", (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d"), "Howrah Jn (HWH)", "New Delhi (NDLS)", "Howrah Jn", "1A", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF H1-Cabin B (Coupe)"}
        ]),
        ("5920194821", "20607", "Chennai - Bengaluru Vande Bharat", (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"), "MGR Chennai Central (MAS)", "KSR Bengaluru (SBC)", "Chennai Central", "EC", "General", "CHART PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF E1-09 (Executive Window)"}
        ]),
        ("8192039485", "12955", "Mumbai Central - Jaipur SF", (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d"), "Mumbai Central (MMCT)", "Jaipur Jn (JP)", "Mumbai Central", "SL", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "WL 25", "current_status": "WL 14"}
        ]),
        ("9382019482", "12137", "Punjab Mail", (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"), "Mumbai CSMT (CSMT)", "New Delhi (NDLS)", "Mumbai CSMT", "2A", "Senior Citizen", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF A2-07 (Lower)"}
        ]),
        ("6281940193", "12723", "Telangana Express", (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"), "Secunderabad Jn (SC)", "New Delhi (NDLS)", "Secunderabad", "3A", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF B1-32 (Upper)"}
        ]),
        ("5019284712", "12007", "Chennai - Mysuru Shatabdi", (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"), "MGR Chennai Central (MAS)", "KSR Bengaluru (SBC)", "Chennai Central", "CC", "Ladies", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF C3-44 (Aisle)"}
        ]),
        ("7729104821", "12841", "Coromandel Express", (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d"), "Howrah Jn (HWH)", "MGR Chennai Central (MAS)", "Howrah Jn", "SL", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF S2-50 (Side Lower)"}
        ]),
        ("8819203912", "12267", "Mumbai - Ahmedabad Duronto", (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"), "Mumbai Central (MMCT)", "Ahmedabad Jn (ADI)", "Mumbai Central", "3A", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF B3-11 (Lower)"}
        ]),
        ("9928103948", "12124", "Deccan Queen Return", (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"), "Pune Jn (PUNE)", "Mumbai CSMT (CSMT)", "Pune Jn", "CC", "General", "CHART PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF C2-33 (Window)"}
        ]),
        ("4491029481", "22436", "Vande Bharat Express (NDLS-BSB)", (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"), "New Delhi (NDLS)", "Jaipur Jn (JP)", "New Delhi", "CC", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF C4-12 (Aisle)"}
        ]),
        ("3382910492", "11301", "Udyan Express", (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d"), "Mumbai CSMT (CSMT)", "KSR Bengaluru (SBC)", "Mumbai CSMT", "SL", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "WL 5", "current_status": "RAC 1"}
        ]),
        ("2281920491", "12289", "Mumbai CSMT - Nagpur Duronto", (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"), "Mumbai CSMT (CSMT)", "Nagpur Jn (NGP)", "Mumbai CSMT", "2A", "General", "CHART NOT PREPARED", [
            {"passenger": "Passenger 1", "booking_status": "CNF", "current_status": "CNF A1-15 (Lower)"}
        ]),
    ]

    for pnr_num, t_num, t_nm, j_dt, src_str, dst_str, b_pt, t_cls, qta, ch_st, p_list in pnr_samples:
        if pnr_num in existing_pnrs:
            continue
        pnr_rec = PNRRecord(
            pnr_number=pnr_num,
            train_number=t_num,
            train_name=t_nm,
            journey_date=j_dt,
            from_station=src_str,
            to_station=dst_str,
            boarding_point=b_pt,
            travel_class=t_cls,
            quota=qta,
            chart_status=ch_st,
            passengers_json=json.dumps(p_list)
        )
        db.add(pnr_rec)

    if db.query(UnreservedTicket).count() == 0:
        print("Seeding Unreserved & Platform Tickets...")
        u1 = UnreservedTicket(
            ticket_ref="UTS-894210",
            user_id=demo_user.id,
            ticket_type="JOURNEY",
            from_station="Mumbai CSMT (CSMT)",
            to_station="Thane (TNA)",
            passenger_count=2,
            travel_class="II",
            fare=40.0,
            validity_start=datetime.utcnow() - timedelta(minutes=15),
            validity_end=datetime.utcnow() + timedelta(hours=3),
            qr_payload="UTS:JOURNEY:CSMT-TNA:PAX2:II:VALID3HRS",
            status="ACTIVE"
        )
        u2 = UnreservedTicket(
            ticket_ref="PLT-459201",
            user_id=demo_user.id,
            ticket_type="PLATFORM",
            from_station="Mumbai Central (MMCT)",
            to_station=None,
            passenger_count=1,
            travel_class="II",
            fare=10.0,
            validity_start=datetime.utcnow() - timedelta(minutes=40),
            validity_end=datetime.utcnow() + timedelta(hours=1, minutes=20),
            qr_payload="UTS:PLATFORM:MMCT:PAX1:VALID2HRS",
            status="ACTIVE"
        )
        u3 = UnreservedTicket(
            ticket_ref="SEA-901842",
            user_id=demo_user.id,
            ticket_type="SEASON",
            from_station="Thane (TNA)",
            to_station="Mumbai CSMT (CSMT)",
            passenger_count=1,
            travel_class="II",
            duration_type="MONTHLY",
            fare=315.0,
            validity_start=datetime.utcnow() - timedelta(days=5),
            validity_end=datetime.utcnow() + timedelta(days=25),
            qr_payload="UTS:SEASON:MONTHLY:TNA-CSMT:PAX1:II",
            status="ACTIVE"
        )
        db.add_all([u1, u2, u3])

    print("Seeding Food Vendors and Menus...")
    vendors_spec = [
        ("Haldiram's Express", "MMCT", "North Indian, Fast Food, Sweets", 4.7, [
            ("Deluxe Thali (Paneer, Dal Makhani, Roti, Rice, Sweet)", 249.0, True, "Meals", "Rich royal vegetarian thali with paneer subzi, dal makhani, 3 rotis, jeera rice, and gulab jamun"),
            ("Chole Bhature (2 pcs)", 149.0, True, "Snacks", "Fluffy hot bhature served with spicy authentic Amritsari chole and pickled onions"),
            ("Pav Bhaji", 130.0, True, "Snacks", "Mumbai street style buttery spiced mashed vegetable bhaji with toasted butter pav"),
            ("Gulab Jamun (2 pcs)", 60.0, True, "Dessert", "Warm soft cottage cheese dumplings steeped in cardamom sugar syrup"),
            ("Special Masala Chai", 30.0, True, "Beverages", "Freshly brewed tea with ginger, cardamom, and clove")
        ]),
        ("Domino's Pizza", "MMCT", "Pizzas, Garlic Bread, Beverages", 4.5, [
            ("Margherita Pizza (Regular)", 169.0, True, "Pizza", "Classic cheese and herbed tomato sauce pizza"),
            ("Farmhouse Pizza (Regular)", 279.0, True, "Pizza", "Loaded with crunchy capsicum, sliced mushroom, fresh tomato, and golden corn"),
            ("Chicken Pepperoni Pizza (Regular)", 349.0, False, "Pizza", "Classic cheese pizza topped with premium savory chicken pepperoni"),
            ("Stuffed Garlic Bread", 149.0, True, "Sides", "Crispy garlic bread stuffed with molten mozzarella cheese and sweet corn"),
            ("Cold Beverage (Can 300ml)", 45.0, True, "Beverages", "Chilled soft drink")
        ]),
        ("Rail Rasoi", "CSMT", "Homestyle Indian Meals & Biryani", 4.6, [
            ("Hyderabadi Chicken Biryani", 260.0, False, "Meals", "Fragrant long-grain basmati rice cooked with tender marinated chicken and spices, served with raita"),
            ("Veg Dum Biryani", 199.0, True, "Meals", "Aromatic slow-cooked spiced vegetable biryani served with refreshing cucumber mint raita"),
            ("Egg Curry Rice Bowl", 175.0, False, "Meals", "Two boiled fried eggs cooked in rich home-style onion-tomato gravy with steamed basmati rice"),
            ("Dal Khichdi Tadka", 140.0, True, "Meals", "Comforting yellow lentil and rice tempered with garlic, cumin, and pure desi ghee"),
            ("Lassi (Sweet)", 50.0, True, "Beverages", "Creamy Punjabi sweet yogurt drink")
        ]),
        ("Bikanervala", "NDLS", "Traditional North Indian, Chaat, Sweets", 4.6, [
            ("Rajbhog Thali", 299.0, True, "Meals", "Shahi paneer, dal fry, mix veg, 4 tawa parathas, pulao, salad, and rasgulla"),
            ("Pani Puri (Pack of 8)", 80.0, True, "Snacks", "Crisp semolina puris with spiced potato filling, sweet dates chutney, and chilled mint water"),
            ("Masala Dosa with Sambar", 120.0, True, "South Indian", "Crisp golden crepe stuffed with tempered spiced potato mash, served with coconut chutney & lentil sambar")
        ]),
        ("Chai Point", "PUNE", "Chai, Filter Coffee, Quick Bites", 4.8, [
            ("Ginger Cardamom Chai (Flask)", 99.0, True, "Beverages", "Hot piping handmade chai in an insulated thermal flask"),
            ("South Indian Filter Coffee", 45.0, True, "Beverages", "Traditional decoction chicory brewed coffee with frothy hot milk"),
            ("Bun Maska", 50.0, True, "Snacks", "Fresh bakery bun generously slathered with salted Amul butter"),
            ("Samosa (2 pcs with Mint Chutney)", 60.0, True, "Snacks", "Crispy spiced potato triangles served with tangy tamarind & spicy mint chutney")
        ])
    ]

    existing_vendors = {v.vendor_name for v in db.query(FoodVendor).all()}
    for v_name, st_code, cuis, rat, items in vendors_spec:
        if v_name in existing_vendors:
            continue
        st_obj = stations.get(st_code, stations.get("MMCT"))
        vendor = FoodVendor(
            station_id=st_obj.id,
            vendor_name=v_name,
            cuisine_type=cuis,
            rating=rat,
            is_active=True
        )
        db.add(vendor)
        db.flush()

        for i_name, pr, veg, cat, desc in items:
            fitem = FoodItem(
                vendor_id=vendor.id,
                item_name=i_name,
                description=desc,
                category=cat,
                price=pr,
                is_veg=veg,
                is_available=True
            )
            db.add(fitem)

    if db.query(Complaint).count() == 0:
        print("Seeding Demo Rail Support Complaints...")
        c1 = Complaint(
            complaint_ref="CMP-849201",
            user_id=demo_user.id,
            pnr="8421098451",
            train_number="12951",
            station_code="MMCT",
            category="Cleanliness",
            description="Washroom in coach B2 requires deep cleaning and soap dispenser is empty.",
            status="IN_REVIEW",
            resolution_notes="Cleaning staff at next stop (Surat) dispatched to inspect."
        )
        c2 = Complaint(
            complaint_ref="CMP-392018",
            user_id=demo_user.id,
            pnr="4521098420",
            train_number="12123",
            station_code="PUNE",
            category="Catering",
            description="Tea was served lukewarm by the pantry attendant.",
            status="RESOLVED",
            resolution_notes="Vendor notified and apologized. Warning issued to on-duty caterer."
        )
        db.add_all([c1, c2])

    if db.query(Notification).count() == 0:
        print("Seeding 15 Notifications (matching badge count 15)...")
        notifications_data = [
            ("Booking Confirmed: Mumbai Rajdhani (12951)", "Your ticket for Mumbai Central to New Delhi on Oct 15 is confirmed in Coach B2, Berth 45.", "booking", False),
            ("Train Delay Alert: 12951 running 10 mins late", "Mumbai Rajdhani Express is currently delayed by 10 minutes near Surat junction.", "delay", False),
            ("Platform Allocation Update", "12123 Deccan Queen will depart from Platform 8 at Mumbai CSMT.", "general", False),
            ("R-Wallet Refund Credited (₹845.00)", "Your refund for Booking BK-304918 has been approved and processed to your R-Wallet.", "refund", False),
            ("Food Delivery Confirmed", "Your food order from Haldiram's Express will be delivered at Surat Station, Coach B2, Seat 45.", "food", False),
            ("Rail Support Update: CMP-849201", "Your cleanliness complaint has been assigned to the housekeeping crew at Surat.", "support", False),
            ("Tatkal Booking Window Opening", "Tatkal quota for your saved route Mumbai to Delhi opens tomorrow at 10:00 AM.", "general", False),
            ("Journey Reminder", "Your upcoming journey on Train 12951 departs in 5 days from Mumbai Central.", "booking", False),
            ("Chart Preparation Notification", "Final passenger reservation charts for Train 12123 Deccan Queen have been prepared.", "general", False),
            ("Special Festive Trains Announced", "50 new festival special trains between Mumbai, Delhi, and Patna added for Diwali rush.", "general", False),
            ("R-Wallet Cashback Earned!", "₹50 promotional cashback added to your R-Wallet balance.", "refund", False),
            ("Coach Position Announced", "Your coach B2 on Train 12951 will be positioned at Platform Zone B.", "general", False),
            ("Safety Advisory: Fog Season Protocol", "Northern Railway has implemented automated fog safety devices on all Rajdhani express rakes.", "general", False),
            ("Complaint Resolved: CMP-392018", "Your complaint regarding catering service on Deccan Queen has been successfully resolved.", "support", False),
            ("Welcome to RailOne!", "Explore seamless ticket booking, live train tracking, PNR status, and onboard e-catering.", "general", True),
        ]

        for title, msg, cat, is_read in notifications_data:
            notif = Notification(
                user_id=demo_user.id,
                title=title,
                message=msg,
                category=cat,
                is_read=is_read,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            )
            db.add(notif)

    db.commit()
    db.close()
    print("Seeding completed successfully!")

def seed_if_empty():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        st_count = db.query(Station).count()
        tr_count = db.query(Train).count()
        if st_count < 256 or tr_count < 50:
            print(f"Safe auto-seed: station count={st_count}, train count={tr_count}. Running idempotent seed...")
            seed(reset=(st_count == 0))
            print("Safe auto-seed complete.")
        else:
            print(f"Database verified: {st_count} stations, {tr_count} trains ready.")
    except Exception as e:
        print(f"Safe seed check notice: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
