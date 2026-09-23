import json
from datetime import datetime, timedelta
import random
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models import (
    User, Passenger, Station, Train, TrainSchedule, Coach, Seat,
    Booking, BookingPassenger, Payment, PNRRecord, UnreservedTicket,
    FoodVendor, FoodItem, FoodOrder, FoodOrderItem, Complaint,
    ComplaintAttachment, Refund, Wallet, WalletTransaction, Notification
)

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data if any
    try:
        # Check if already seeded
        if db.query(Station).count() > 0:
            print("Database already has data. Dropping and re-seeding...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Resetting tables: {e}")

    print("Seeding Stations...")
    station_data = [
        {"code": "MMCT", "name": "Mumbai Central", "city": "Mumbai", "state": "Maharashtra", "zone": "WR", "platform_count": 8, "latitude": 18.9696, "longitude": 72.8193},
        {"code": "CSMT", "name": "Mumbai Chhatrapati Shivaji Maharaj Terminus", "city": "Mumbai", "state": "Maharashtra", "zone": "CR", "platform_count": 18, "latitude": 18.9400, "longitude": 72.8353},
        {"code": "TNA", "name": "Thane", "city": "Thane", "state": "Maharashtra", "zone": "CR", "platform_count": 10, "latitude": 19.1860, "longitude": 72.9759},
        {"code": "PUNE", "name": "Pune Junction", "city": "Pune", "state": "Maharashtra", "zone": "CR", "platform_count": 6, "latitude": 18.5289, "longitude": 73.8744},
        {"code": "NK", "name": "Nashik Road", "city": "Nashik", "state": "Maharashtra", "zone": "CR", "platform_count": 4, "latitude": 19.9547, "longitude": 73.8373},
        {"code": "NGP", "name": "Nagpur Junction", "city": "Nagpur", "state": "Maharashtra", "zone": "CR", "platform_count": 8, "latitude": 21.1528, "longitude": 79.0882},
        {"code": "NDLS", "name": "New Delhi", "city": "Delhi", "state": "Delhi", "zone": "NR", "platform_count": 16, "latitude": 28.6415, "longitude": 77.2207},
        {"code": "DLI", "name": "Old Delhi Junction", "city": "Delhi", "state": "Delhi", "zone": "NR", "platform_count": 16, "latitude": 28.6607, "longitude": 77.2285},
        {"code": "SBC", "name": "KSR Bengaluru City Junction", "city": "Bengaluru", "state": "Karnataka", "zone": "SWR", "platform_count": 10, "latitude": 12.9784, "longitude": 77.5694},
        {"code": "MAS", "name": "MGR Chennai Central", "city": "Chennai", "state": "Tamil Nadu", "zone": "SR", "platform_count": 17, "latitude": 13.0827, "longitude": 80.2755},
        {"code": "SC", "name": "Secunderabad Junction", "city": "Hyderabad", "state": "Telangana", "zone": "SCR", "platform_count": 10, "latitude": 17.4344, "longitude": 78.5015},
        {"code": "ADI", "name": "Ahmedabad Junction", "city": "Ahmedabad", "state": "Gujarat", "zone": "WR", "platform_count": 12, "latitude": 23.0238, "longitude": 72.6006},
        {"code": "ST", "name": "Surat", "city": "Surat", "state": "Gujarat", "zone": "WR", "platform_count": 6, "latitude": 21.2049, "longitude": 72.8406},
        {"code": "JP", "name": "Jaipur Junction", "city": "Jaipur", "state": "Rajasthan", "zone": "NWR", "platform_count": 8, "latitude": 26.9196, "longitude": 75.7878},
        {"code": "HWH", "name": "Howrah Junction", "city": "Kolkata", "state": "West Bengal", "zone": "ER", "platform_count": 23, "latitude": 22.5839, "longitude": 88.3426},
    ]

    stations = {}
    for s in station_data:
        st = Station(**s)
        db.add(st)
        db.flush()
        stations[s["code"]] = st

    print("Seeding Users...")
    # Demo User matching screenshot name: Manali Manish Gharat
    demo_user = User(
        email="demo@railmate.com",
        mobile="9876543210",
        full_name="Manali Manish Gharat",
        hashed_password=get_password_hash("password123"),
        role="user",
        dob="1995-08-14",
        gender="Female",
        address="Bandra West, Mumbai, Maharashtra 400050",
        profile_completion=85,
        is_active=True
    )
    db.add(demo_user)
    db.flush()

    admin_user = User(
        email="admin@railmate.com",
        mobile="9998887770",
        full_name="RailMate Admin",
        hashed_password=get_password_hash("adminpassword123"),
        role="admin",
        dob="1988-04-12",
        gender="Male",
        address="Railway Bhavan, New Delhi 110001",
        profile_completion=100,
        is_active=True
    )
    db.add(admin_user)
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

    print("Seeding 32 Trains & Schedules...")
    trains_spec = [
        # Mumbai to Delhi Corridor
        ("12951", "Mumbai Rajdhani Express", "Rajdhani", "MMCT", "NDLS", "17:00", "08:32", 15.5, "1,2,3,4,5,6,7", "1A,2A,3A,3E",
         [("MMCT", 0, "17:00", "17:00", 0, 1, 0), ("ST", 1, "19:43", "19:48", 5, 1, 263), ("ADI", 2, "22:15", "22:25", 10, 1, 492), ("NDLS", 3, "08:32", "08:32", 0, 2, 1384)]),
        ("12952", "New Delhi - Mumbai Rajdhani", "Rajdhani", "NDLS", "MMCT", "16:55", "08:35", 15.6, "1,2,3,4,5,6,7", "1A,2A,3A,3E",
         [("NDLS", 0, "16:55", "16:55", 0, 1, 0), ("ADI", 1, "03:10", "03:20", 10, 2, 892), ("ST", 2, "05:40", "05:45", 5, 2, 1121), ("MMCT", 3, "08:35", "08:35", 0, 2, 1384)]),
        ("12953", "August Kranti Tejas Rajdhani", "Tejas Express", "MMCT", "NDLS", "17:10", "09:43", 16.5, "1,2,3,4,5,6,7", "1A,2A,3A",
         [("MMCT", 0, "17:10", "17:10", 0, 1, 0), ("TNA", 1, "17:45", "17:47", 2, 1, 34), ("ST", 2, "20:50", "20:55", 5, 1, 263), ("JP", 3, "05:30", "05:40", 10, 2, 1100), ("NDLS", 4, "09:43", "09:43", 0, 2, 1384)]),
        ("22221", "Mumbai CSMT - NZM Rajdhani", "Rajdhani", "CSMT", "NDLS", "16:10", "09:55", 17.7, "1,3,4,6", "1A,2A,3A",
         [("CSMT", 0, "16:10", "16:10", 0, 1, 0), ("NK", 1, "19:18", "19:20", 2, 1, 187), ("NGP", 2, "01:25", "01:30", 5, 2, 837), ("NDLS", 3, "09:55", "09:55", 0, 2, 1540)]),
        
        # Mumbai to Ahmedabad
        ("20901", "Mumbai - Gandhinagar Vande Bharat", "Vande Bharat", "MMCT", "ADI", "06:00", "11:25", 5.4, "1,2,3,4,5,6", "CC,EC",
         [("MMCT", 0, "06:00", "06:00", 0, 1, 0), ("ST", 1, "08:37", "08:40", 3, 1, 263), ("ADI", 2, "11:25", "11:30", 5, 1, 492)]),
        ("20902", "Gandhinagar - Mumbai Vande Bharat", "Vande Bharat", "ADI", "MMCT", "15:00", "20:25", 5.4, "1,2,3,4,5,6", "CC,EC",
         [("ADI", 0, "15:00", "15:00", 0, 1, 0), ("ST", 1, "17:43", "17:46", 3, 1, 229), ("MMCT", 2, "20:25", "20:25", 0, 1, 492)]),
        ("12009", "Mumbai - Ahmedabad Shatabdi", "Shatabdi", "MMCT", "ADI", "06:20", "12:45", 6.4, "1,2,3,4,5,6", "CC,EC",
         [("MMCT", 0, "06:20", "06:20", 0, 1, 0), ("ST", 1, "09:15", "09:18", 3, 1, 263), ("ADI", 2, "12:45", "12:45", 0, 1, 492)]),
        ("12267", "Mumbai - Ahmedabad Duronto", "Duronto", "MMCT", "ADI", "23:25", "05:55", 6.5, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("MMCT", 0, "23:25", "23:25", 0, 1, 0), ("ADI", 1, "05:55", "05:55", 0, 2, 492)]),

        # Mumbai to Pune
        ("12123", "Deccan Queen Superfast", "Superfast", "CSMT", "PUNE", "17:10", "20:25", 3.2, "1,2,3,4,5,6,7", "CC,2S",
         [("CSMT", 0, "17:10", "17:10", 0, 1, 0), ("TNA", 1, "17:40", "17:42", 2, 1, 34), ("PUNE", 2, "20:25", "20:25", 0, 1, 192)]),
        ("12124", "Deccan Queen Return", "Superfast", "PUNE", "CSMT", "07:15", "10:25", 3.1, "1,2,3,4,5,6,7", "CC,2S",
         [("PUNE", 0, "07:15", "07:15", 0, 1, 0), ("TNA", 1, "09:40", "09:42", 2, 1, 158), ("CSMT", 2, "10:25", "10:25", 0, 1, 192)]),
        ("22105", "Indrayani Express", "Express", "CSMT", "PUNE", "05:40", "09:05", 3.4, "1,2,3,4,5,6,7", "CC,2S",
         [("CSMT", 0, "05:40", "05:40", 0, 1, 0), ("TNA", 1, "06:14", "06:16", 2, 1, 34), ("PUNE", 2, "09:05", "09:05", 0, 1, 192)]),

        # Mumbai to Howrah / Nagpur
        ("12859", "Gitanjali Express", "Superfast", "CSMT", "HWH", "06:00", "12:30", 30.5, "1,2,3,4,5,6,7", "2A,3A,SL,2S",
         [("CSMT", 0, "06:00", "06:00", 0, 1, 0), ("NK", 1, "09:30", "09:35", 5, 1, 187), ("NGP", 2, "18:55", "19:00", 5, 1, 837), ("HWH", 3, "12:30", "12:30", 0, 2, 1968)]),
        ("12289", "Mumbai CSMT - Nagpur Duronto", "Duronto", "CSMT", "NGP", "20:15", "07:20", 11.0, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("CSMT", 0, "20:15", "20:15", 0, 1, 0), ("NGP", 1, "07:20", "07:20", 0, 2, 837)]),
        ("12137", "Punjab Mail", "Express", "CSMT", "NDLS", "19:35", "19:10", 23.5, "1,2,3,4,5,6,7", "1A,2A,3A,SL,2S",
         [("CSMT", 0, "19:35", "19:35", 0, 1, 0), ("NK", 1, "23:10", "23:15", 5, 1, 187), ("NDLS", 2, "19:10", "19:10", 0, 2, 1540)]),

        # Mumbai to Bengaluru & Chennai
        ("11301", "Udyan Express", "Express", "CSMT", "SBC", "08:10", "07:45", 23.5, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("CSMT", 0, "08:10", "08:10", 0, 1, 0), ("PUNE", 1, "11:50", "11:55", 5, 1, 192), ("SBC", 2, "07:45", "07:45", 0, 2, 1136)]),
        ("12163", "Mumbai LTT - Chennai Superfast", "Superfast", "CSMT", "MAS", "18:45", "16:20", 21.5, "1,2,3,4,5,6,7", "2A,3A,SL",
         [("CSMT", 0, "18:45", "18:45", 0, 1, 0), ("PUNE", 1, "22:10", "22:15", 5, 1, 192), ("MAS", 2, "16:20", "16:20", 0, 2, 1281)]),

        # Delhi to Bengaluru, Chennai, Kolkata
        ("12627", "Karnataka Express", "Superfast", "NDLS", "SBC", "20:20", "12:00", 39.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("NDLS", 0, "20:20", "20:20", 0, 1, 0), ("NGP", 1, "12:20", "12:25", 5, 2, 1091), ("SC", 2, "20:40", "20:45", 5, 2, 1672), ("SBC", 3, "12:00", "12:00", 0, 3, 2408)]),
        ("12626", "Kerala Express", "Superfast", "NDLS", "MAS", "20:10", "04:30", 32.3, "1,2,3,4,5,6,7", "2A,3A,SL",
         [("NDLS", 0, "20:10", "20:10", 0, 1, 0), ("NGP", 1, "11:45", "11:50", 5, 2, 1091), ("MAS", 2, "04:30", "04:30", 0, 3, 2182)]),
        ("12301", "Howrah Rajdhani Express", "Rajdhani", "HWH", "NDLS", "16:50", "10:05", 17.2, "1,2,3,4,5,7", "1A,2A,3A",
         [("HWH", 0, "16:50", "16:50", 0, 1, 0), ("NDLS", 1, "10:05", "10:05", 0, 2, 1451)]),
        ("12302", "New Delhi - Howrah Rajdhani", "Rajdhani", "NDLS", "HWH", "16:55", "09:55", 17.0, "1,2,3,5,6,7", "1A,2A,3A",
         [("NDLS", 0, "16:55", "16:55", 0, 1, 0), ("HWH", 1, "09:55", "09:55", 0, 2, 1451)]),
        ("22436", "Vande Bharat Express (NDLS-BSB)", "Vande Bharat", "NDLS", "JP", "06:00", "10:30", 4.5, "1,2,3,5,6,7", "CC,EC",
         [("NDLS", 0, "06:00", "06:00", 0, 1, 0), ("JP", 1, "10:30", "10:30", 0, 1, 308)]),

        # Chennai - Bengaluru - Hyderabad
        ("12007", "Chennai - Mysuru Shatabdi", "Shatabdi", "MAS", "SBC", "06:00", "10:55", 4.9, "1,3,4,5,6,7", "CC,EC",
         [("MAS", 0, "06:00", "06:00", 0, 1, 0), ("SBC", 1, "10:55", "11:00", 5, 1, 359)]),
        ("20607", "Chennai - Bengaluru Vande Bharat", "Vande Bharat", "MAS", "SBC", "05:50", "10:20", 4.5, "1,2,3,4,5,6", "CC,EC",
         [("MAS", 0, "05:50", "05:50", 0, 1, 0), ("SBC", 1, "10:20", "10:25", 5, 1, 359)]),
        ("12723", "Telangana Express", "Superfast", "SC", "NDLS", "06:00", "07:40", 25.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("SC", 0, "06:00", "06:00", 0, 1, 0), ("NGP", 1, "15:20", "15:25", 5, 1, 581), ("NDLS", 2, "07:40", "07:40", 0, 2, 1672)]),
        ("12724", "Telangana Express Return", "Superfast", "NDLS", "SC", "16:00", "17:10", 25.1, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("NDLS", 0, "16:00", "16:00", 0, 1, 0), ("NGP", 1, "07:10", "07:15", 5, 2, 1091), ("SC", 2, "17:10", "17:10", 0, 2, 1672)]),

        # Mumbai to Jaipur & Rajasthan
        ("12955", "Mumbai Central - Jaipur Superfast", "Superfast", "MMCT", "JP", "19:05", "12:45", 17.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("MMCT", 0, "19:05", "19:05", 0, 1, 0), ("ST", 1, "22:30", "22:35", 5, 1, 263), ("JP", 2, "12:45", "12:45", 0, 2, 1159)]),
        ("12956", "Jaipur - Mumbai Central Superfast", "Superfast", "JP", "MMCT", "14:00", "07:40", 17.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("JP", 0, "14:00", "14:00", 0, 1, 0), ("ST", 1, "04:10", "04:15", 5, 2, 896), ("MMCT", 2, "07:40", "07:40", 0, 2, 1159)]),
        ("12979", "Bandra Terminus - Jaipur SF", "Superfast", "MMCT", "JP", "17:05", "10:30", 17.4, "2,4,6", "2A,3A,SL,2S",
         [("MMCT", 0, "17:05", "17:05", 0, 1, 0), ("ST", 1, "20:35", "20:40", 5, 1, 263), ("JP", 2, "10:30", "10:30", 0, 2, 1159)]),

        # Kolkata to South & West
        ("12841", "Coromandel Express", "Superfast", "HWH", "MAS", "15:20", "17:00", 25.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("HWH", 0, "15:20", "15:20", 0, 1, 0), ("MAS", 1, "17:00", "17:00", 0, 2, 1662)]),
        ("12842", "Coromandel Express Return", "Superfast", "MAS", "HWH", "07:00", "10:40", 27.6, "1,2,3,4,5,6,7", "1A,2A,3A,SL",
         [("MAS", 0, "07:00", "07:00", 0, 1, 0), ("HWH", 1, "10:40", "10:40", 0, 2, 1662)]),
        ("12245", "Howrah - Yesvantpur Duronto", "Duronto", "HWH", "SBC", "10:50", "16:00", 29.1, "2,3,5,6,7", "1A,2A,3A,SL",
         [("HWH", 0, "10:50", "10:50", 0, 1, 0), ("SBC", 1, "16:00", "16:00", 0, 2, 1946)]),
        ("12051", "Mumbai CSMT - Madgaon Jan Shatabdi", "Superfast", "CSMT", "PUNE", "05:10", "08:40", 3.5, "1,2,3,4,5,6,7", "CC,2S",
         [("CSMT", 0, "05:10", "05:10", 0, 1, 0), ("TNA", 1, "05:43", "05:45", 2, 1, 34), ("PUNE", 2, "08:40", "08:40", 0, 1, 192)])
    ]

    coach_templates = {
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

    created_trains = []
    for num, name, ttype, src, dst, dep, arr, dur, days, classes, stops in trains_spec:
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
        qr_code="RAILMATE:PNR:8421098451:MMCT:NDLS:3A:CONFIRMED"
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
        qr_code="RAILMATE:PNR:4521098420:CSMT:PUNE:CC:COMPLETED"
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
        qr_code="RAILMATE:PNR:6521908412:MMCT:ADI:CC:CANCELLED"
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

    for v_name, st_code, cuis, rat, items in vendors_spec:
        st_obj = stations.get(st_code, stations["MMCT"])
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
        ("Welcome to RailMate!", "Explore seamless ticket booking, live train tracking, PNR status, and onboard e-catering.", "general", True),
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

if __name__ == "__main__":
    seed()
