# AquaSense AI &mdash; Intelligent Water Quality Monitoring and Contamination Analysis System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.119-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_TypeScript_Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn_XGBoost-F7931E.svg?style=flat&logo=scikit-learn)](https://scikit-learn.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_SQLAlchemy-336791.svg?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-13_Passed_Pytest-success.svg?style=flat)](https://pytest.org)

> **Important Educational & Decision-Support Notice:**
> AquaSense AI is an educational screening and decision-support system. It evaluates physical and chemical parameter deviations against reference ranges inspired by general environmental guidelines (WHO, EPA). It does not claim to certify drinking-water potability or detect specific microbiological pathogens without laboratory confirmatory testing.

---

## 🌊 System Overview

**AquaSense AI** is an intelligent, full-stack environmental analytics platform designed to analyze water parameters, detect multi-dimensional anomalies, classify water quality conditions into 4 actionable tiers, flag potential contamination risks, and generate publication-style analytical reports.

### Key Capabilities
- **Three Data Collection Channels:**
  1. **CSV / XLSX / XLS Dataset Upload** with drag-and-drop validation, missing value imputation, duplicate removal, and batch import.
  2. **Manual Water Sample Entry** with automatic Sample ID generation, field validation, and 1-click loading of standard testing scenarios (Scenarios 1 through 6).
  3. **IoT Sensor Stations** architecture ready for continuous stream telemetry.
- **Machine Learning & Ensemble Classification:**
  - **Random Forest Classifier** (Multi-class quality classification with feature importance)
  - **XGBoost Classifier** (Gradient-boosted decision trees)
  - **Decision Tree & Logistic Regression** (Interpretable baselines)
  - **Isolation Forest** (Unsupervised statistical outlier & anomaly detection)
  - **K-Means Clustering** (Catchment profiling & centroid analysis)
- **4-Tier Water Quality Classification:**
  1. `Good Quality` (WQI &ge; 80, all parameters within optimal baseline)
  2. `Moderate Quality` (WQI 60-80, minor parameter elevations)
  3. `Poor Quality` (WQI 40-60, notable degradation requiring review)
  4. `Potentially Contaminated` (WQI &lt; 40 or multiple critical violations)
- **Geospatial & Trend Analytics:**
  - Interactive Leaflet OpenStreetMap with color-coded station pins and anomaly alerts.
  - Time-series charts for pH, Turbidity, DO, TDS, Conductivity, and Temperature.
- **Automated Reporting:**
  - Downloadable PDF reports generated with **ReportLab**.
  - Multi-sheet Excel workbooks generated with **OpenPyXL**.
- **Role-Based Security:**
  - JWT Authentication with bcrypt hashing.
  - Admin (user management, location creation) vs. Standard Analyst permissions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons, Leaflet |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Pandas, NumPy |
| **Machine Learning** | Scikit-learn, XGBoost, Isolation Forest, K-Means, Joblib |
| **Database** | PostgreSQL 15+ (with seamless SQLite fallback for zero-dependency standalone execution) |
| **Reports** | ReportLab (PDF), OpenPyXL (Excel) |
| **DevOps & Containers** | Docker, Docker Compose, Pytest |

---

## 🚀 Quickstart & Execution Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker and Docker Compose

### 1. Backend Setup & Startup

#### Windows PowerShell:
```powershell
# Navigate to project root
cd "c:\Project\AquaSense AI - intelligent water Quality Monitoring and contamination Analysis System\code"

# Create and activate virtual environment (if not already created)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend\requirements.txt

# Seed demonstration database and train initial ML models
python database\seed.py

# Launch FastAPI development server
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
python database/seed.py
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup & Startup

```powershell
cd frontend
npm install
npm run dev
```

The application will be live at:
- **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🐳 Docker Compose Deployment

To run the complete production-style stack (PostgreSQL + FastAPI + Nginx React Frontend):

```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: Port `5432`

---

## 🔑 Initial Demonstration Credentials

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Administrator** | `admin@aquasense.org` | `AdminPassword123!` | Full control, User Management, Threshold settings, All stations |
| **Standard Analyst** | `user@aquasense.org` | `UserPassword123!` | Sample entry, Dataset uploads, Analysis inspection, PDF/Excel export |

*(Quick-fill buttons are provided on the login page for instantaneous testing).*

---

## 🧪 Testing Scenarios (Section 6 & 21 Compliance)

The system includes pre-configured testing records under `backend/data/manual_testing_samples.json` and 1-click loading buttons in the **Manual Sample Entry** view:

| Scenario | Sample ID | Key Values | Expected Screening Outcome |
|---|---|---|---|
| **Scenario 1: Normal Sample** | `WQ001` | pH 7.2, Turb 1.5, DO 7.8, TDS 280 | **Good Quality**, WQI &gt; 80, 0 alerts |
| **Scenario 2: Acidic Water** | `WQ002` | pH 5.2, Turb 8.5, DO 4.0, TDS 650 | **Poor Quality**, Acidic pH alert generated |
| **Scenario 3: High Turbidity** | `WQ003` | Turbidity 15.0 NTU | **Moderate/Poor**, Elevated Turbidity flag |
| **Scenario 4: High TDS** | `WQ004` | TDS 1200 mg/L, EC 1800 µS/cm | **Moderate**, High Mineral load observation |
| **Scenario 5: Low Dissolved O2** | `WQ005` | DO 2.5 mg/L, Temp 30°C | **Poor Quality**, Critical Low DO alert & Aeration action |
| **Scenario 6: Multiple Abnormal** | `WQ006` | pH 4.5, Turb 20, DO 2.0, TDS 1500 | **Potentially Contaminated**, High Severity Anomaly |

### Running Automated Pytest Suite:
```powershell
.\venv\Scripts\pytest backend\tests -v
```
Output: `13 passed, 100% test coverage for core workflows.`

---

## 📁 Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes/        # Auth, Dashboard, Samples, Datasets, ML, Locations, Alerts, Reports, Settings
│   │   ├── core/              # Config, Security, JWT, Threshold definitions
│   │   ├── database/          # SQLAlchemy session, engine, connection failover
│   │   ├── models/            # 10 database tables (User, Sample, Parameter, Analysis, Anomaly, Alert, etc.)
│   │   ├── schemas/           # Pydantic v2 schemas
│   │   ├── services/          # Analytical pipeline & orchestrator
│   │   ├── ml/                # Preprocessing, Training, Random Forest, XGBoost, Isolation Forest, K-Means
│   │   ├── reports/           # ReportLab PDF & OpenPyXL Excel generators
│   │   └── main.py            # FastAPI application factory
│   ├── data/                  # sample_water_quality.csv, manual_testing_samples.json
│   ├── tests/                 # 13 automated Pytest test cases
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, Layout, StatCard, Charts, Maps
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── pages/             # 20 feature views and management consoles
│   │   ├── services/          # Axios API service client
│   │   ├── types/             # TypeScript interfaces
│   │   └── App.tsx            # Routes configuration
│   ├── package.json
│   └── vite.config.ts
├── database/
│   └── seed.py                # Database seeder (creates users, locations, 32 samples, analyses)
├── docs/
│   ├── API_DOCUMENTATION.md   # Complete RESTful endpoint reference
│   ├── DATABASE_SCHEMA.md     # Detailed schema & entity relationships
│   └── TESTING_GUIDE.md       # Step-by-step 20-scenario testing instructions
├── docker-compose.yml         # Container orchestrator
└── README.md
```

---

## 📄 License
Educational and Research Use Only &bull; AquaSense AI Development Team
