# RailOne — Your Journey, Simplified.

A complete full-stack mobile-first railway journey application inspired by modern Indian railway super-apps, featuring an original visual identity, rich feature set, and production-ready architecture.

> [!NOTE]
> **Learning / Demonstration Project Notice**:
> This application is an educational prototype named **RailOne**. All train schedules, PNR statuses, coach layouts, simulated GPS positions, and payment gateways operate in **Demo Mode** using simulated data (*"Demo data — not live railway information"*). It is not affiliated with or endorsed by CRIS, IRCTC, or Indian Railways.

---

## 📸 Key Features

- **Pixel-Accurate Visual Hierarchy (Mobile-First 360px–430px & Responsive Desktop)**:
  - Top header with circular Language Switcher button (`A/अ`), centered geometric RailOne logo, and Notification bell with active red badge count (`15`).
  - Personalized dynamic greeting: *"Hi, Manali Manish Gharat!"*.
  - **Journey Planner Section**: 3 large rounded cards (**Reserved**, **Unreserved**, **Platform**) with custom SVG travel illustrations.
  - **More Offerings Grid**: 8 colorful pastel squircle service tiles:
    1. **Search Trains** (Soft Rose)
    2. **PNR Status** (Soft Mint Green)
    3. **Coach Position** (Soft Sky Blue)
    4. **Track Your Train** (Soft Amber)
    5. **Order Food** (Soft Lavender)
    6. **File Refund** (Soft Neutral Gray)
    7. **Rail Support** (Soft Peach / Coral)
    8. **R-Wallet** (Soft Slate / Indigo)
  - **"Do You Know?" Railway Trivia Carousel**: Interactive horizontal cards highlighting Indian railway heritage & engineering feats.
  - Fixed bright blue bottom navigation bar (**Home**, **My Bookings**, **You**, **Menu**) with active pill indicators.

- **Complete Feature Suite**:
  - **Comprehensive Railway Station Master & Ranked Search**: 150+ master Indian Railway junctions, terminals, and divisional stations with canonical codes (`KYN`, `CSMT`, `MMCT`, `NDLS`, `PUNE`, `HWH`, `MAS`, `SBC`, etc.), railway zones, divisions, and search aliases (`cst`/`vt` $\rightarrow$ CSMT, `bombay` $\rightarrow$ Mumbai stations, `delhi` $\rightarrow$ Delhi terminals). Scored live search ranking (exact code match > prefix code > name > city > aliases) with popular station chips and `localStorage` recent stations.
  - **City Cluster / Terminal Search Aggregation**: Travelers searching metropolitan terminals like `MMCT` $\rightarrow$ `PUNE` automatically match corridor trains across Mumbai and Pune clusters even if trains originate at adjacent terminals (e.g. CSMT, Dadar, LTT).
  - **Dynamic UTS / Unreserved Station Selection**: Unreserved journey, platform ticket, and season pass station selection seamlessly browses the complete station master via autocomplete drawer and modal browser with station swapping and same-station error prevention.
  - **Indian Phone Number Registration & OTP Verification**: Sign-up with 10-digit Indian mobile number (`+91XXXXXXXXXX`), phone OTP verification with 6-digit passcode (`123456`), verified phone badge on User Account page, and verification prompts.
  - **Intermediate Route Search & Ordering**: Searches evaluate `src_schedule.stop_sequence < dst_schedule.stop_sequence` so intermediate junction journeys (e.g. Kalyan $\rightarrow$ Pune, Dadar $\rightarrow$ Delhi, Surat $\rightarrow$ Vadodara) return accurate trains with dynamic intermediate departure/arrival times, intermediate durations, and pro-rated fares.
  - **Station Swap & Validation UX**: Animated 180° rotation on From/To swap with validation preventing identical station selection.
  - **6-Digit mPIN Security**: Bcrypt-hashed passcodes (never plaintext) with dedicated 6-dot circle keypad, shake animation on error, 5 failed attempts limit, and 15-minute temporary lockout.
  - **WebAuthn Biometric Authentication**: W3C FIDO2 standard platform authenticator (Windows Hello, Touch ID, Face ID, Android Biometrics). Seamless priority login: Biometrics first $\rightarrow$ immediate fallback to 6-digit mPIN $\rightarrow$ password login.
  - **Security & Fast Login Settings**: Configurable under `You -> Account -> Security & Fast Login` with mPIN setup/change/toggle and biometric passkey device registration.
  - **Reserved Ticket Booking**: Autocomplete station search drawer, calendar picker, class (1A, 2A, 3A, 3E, SL, CC, EC, 2S), quotas (General, Tatkal, Ladies, Senior Citizen, Divyang), live seat availability with probabilities.
  - **Passenger Details & Master List**: Berth preferences (Lower, Middle, Upper, Side Lower, Side Upper), meal preferences, saved traveler chips.
  - **Mock Payment Gateway**: UPI, R-Wallet, Cards, Netbanking with animated multi-stage verification and confetti celebration.
  - **Digital Travel Ticket**: 10-digit PNR, booking ID, allocated coach & berth, QR verification code, PDF print/download, sharing, and instant cancellation.
  - **Unreserved Ticketing (UTS)**: Paperless journey tickets with simulated geofencing range verification, platform tickets (₹10/pax), and monthly/quarterly season passes.
  - **10-Digit PNR Status**: Chart preparation status, coach & seat confirmation, with 20+ pre-seeded test PNRs.
  - **Live Train Tracking ("Track Your Train")**: Live simulated GPS status, delay minutes, distance covered, schematic route map, and journey timeline.
  - **Live Station Board**: Real-time arrivals & departures, platform numbers, and delays.
  - **Coach Position Finder**: Interactive visual platform diagram with Locomotive, General, Sleeper, and AC rakes, highlighting user's coach and platform zone (e.g. Platform Zone B).
  - **Onboard Food Delivery (e-Catering)**: Station-based restaurant menus (Haldiram's, Domino's, Rail Rasoi, Chai Point), veg/non-veg filters, floating cart, and berth delivery tracking.
  - **Rail Support (Passenger Grievance)**: Multi-category grievance registration, mock photo attachments, complaint IDs (`CMP-XXXXXX`), and status tracking timeline.
  - **R-Wallet**: Preloaded balance, one-click checkout, instant cancellation refunds, and transaction history.
  - **Multilingual Support (i18n)**: Instant switching between **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
  - **Admin Control Center**: Operations dashboard with revenue metrics, active bookings, food orders, complaint management, and train fleet overview.

---

## 🛠 Tech Stack

- **Frontend**:
  - React 19 + TypeScript
  - Vite
  - Tailwind CSS
  - React Router v6
  - TanStack React Query
  - Lucide React Icons
  - Canvas Confetti

- **Backend**:
  - Python 3.11+
  - FastAPI
  - SQLAlchemy 2.0 ORM
  - Pydantic v2
  - JWT Authentication (`python-jose`)
  - Direct `bcrypt` password hashing
  - Pytest & HTTPX test suite

- **Database**:
  - SQLite (zero-config local default `railmate.db`)
  - PostgreSQL (production & Docker ready)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (Node v24 recommended)
- **Python**: 3.10+ (Python 3.14 tested & supported)

---

### 2. Backend Setup

```bash
# In the project root
# Activate the virtual environment:
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# Install requirements (already installed in venv)
pip install -r backend/requirements.txt
pip install email-validator bcrypt

# Seed the database with 36 trains, 152 stations, sample PNRs, food menus:
$env:PYTHONPATH="backend"
python backend/app/seed/seed_data.py

# Run the FastAPI server:
uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend API will be running at: `http://localhost:8000`  
Swagger Interactive Documentation: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (already installed)
npm install

# Start Vite development server:
npm run dev
```
Frontend will be running at: `http://localhost:5173`

---

### 4. Running with Docker Compose (Optional)

To start PostgreSQL, FastAPI backend, and Nginx frontend together:

```bash
docker-compose up --build
```
- Web Application: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🔑 Demo Credentials

| Role | Email / Login | Password | Initial State |
| :--- | :--- | :--- | :--- |
| **Demo User** | `demo@railone.com` | `password123` | Logged in as **Manali Manish Gharat**, ₹2,500 R-Wallet balance, 15 unread alerts, Verified Phone (`+919876543210`) |
| **Administrator** | `admin@railone.com` | `adminpassword123` | Full access to Admin Control Center & Operations |

---

## 🧪 Running Automated Tests

```bash
# Run backend pytest suite (covers auth, search, booking, pnr, tracking, wallet, phone OTP):
$env:PYTHONPATH="backend"
pytest backend/tests -v
```

```bash
# Run frontend TypeScript & bundle check:
cd frontend
npm run build
```

---

## 📁 Project Structure

```
RailGo/
├── backend/
│   ├── app/
│   │   ├── core/         # Config, Database engine, Security & JWT
│   │   ├── models/       # SQLAlchemy models (User, PhoneOTP, Train, Booking, PNR, etc.)
│   │   ├── schemas/      # Pydantic v2 validation models
│   │   ├── routers/      # REST API route handlers
│   │   ├── seed/         # Rich seeder script (36 trains, 152 stations, menus, PNRs)
│   │   └── main.py       # FastAPI application entrypoint
│   ├── tests/            # Pytest test suite
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # API client & fetch abstraction
│   │   ├── assets/       # Original SVG travel illustrations & RailOne logo
│   │   ├── components/   # Header, BottomNav, StationAutocomplete, Notices
│   │   ├── context/      # AuthContext & LanguageContext (EN, HI, MR)
│   │   ├── pages/        # All feature screens
│   │   ├── types/        # TypeScript interfaces
│   │   ├── App.tsx       # Router configuration & mobile layout frame
│   │   └── index.css     # Tailwind styling
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📄 License
Educational / Demo Project for showcasing full-stack mobile-first web engineering.
