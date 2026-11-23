# AquaSense AI &mdash; Comprehensive Testing Guide

This testing guide details the execution of the **20 Manual Test Scenarios** specified in Section 21 of the Master Development Prompt, along with automated verification commands.

---

## Automated Backend Test Suite
Run the automated pytest suite verifying authentication, ML inference, anomaly scoring, parameter validation, and report generation:

```powershell
.\venv\Scripts\pytest backend\tests -v
```

All 13 integration and unit tests pass with 100% green status.

---

## Manual Verification of Required Test Scenarios

### Test 1: User Registration & Login
1. Navigate to `http://localhost:5173/login`.
2. Click **Admin User** quick-fill button (`admin@aquasense.org` / `AdminPassword123!`).
3. Click **Sign In**.
4. Verify redirection to the Main Dashboard and display of Dr. Elena Vance's user badge.

### Test 2: Dashboard KPI Metrics Verification
1. Open Main Dashboard (`/`).
2. Verify dynamic statistics calculated from the database:
   - Total Water Samples (&ge; 32)
   - Monitoring Locations (7)
   - Good Quality, Moderate Quality, Poor Quality, Potentially Contaminated counts.
   - Total Anomalies Detected and Active Alerts count.

### Test 3: Upload Sample Dataset
1. Navigate to **Dataset Upload** (`/datasets/upload`).
2. Select or drag `backend/data/sample_water_quality.csv`.
3. Click **Upload & Preview Dataset**.

### Test 4: Preview Uploaded Dataset
1. Verify displayed preprocessing summary:
   - Original rows: 32
   - Cleaned rows: 32
   - Missing values handled: 0
   - Duplicates detected: 0
   - Outliers flagged: 0
2. Inspect the first 10 row preview table.

### Test 5: Import Dataset into Database
1. Click **Confirm Import into Database**.
2. Notice confirmation message and redirect to Water Sample Records table.

### Test 6: Scenario 1 &mdash; Normal Water Sample (WQ001)
1. Navigate to **Manual Sample Entry** (`/samples/new`).
2. Click preset button **WQ001 (Scenario 1)**.
3. Review populated fields:
   - Location: Sample Lake A
   - pH: 7.2, Turbidity: 1.5 NTU, Temp: 25°C, DO: 7.8 mg/L, TDS: 280 mg/L, EC: 450 µS/cm.
4. Click **Save & Run AI Analysis**.
5. Verify result: **Good Quality**, WQI &gt; 80, Normal envelope, 0 active alerts.

### Test 7: Scenario 2 &mdash; Acidic Water Sample (WQ002)
1. Click **WQ002 (Scenario 2)** on the entry page.
2. Review populated fields: pH 5.2, Turbidity 8.5 NTU, DO 4.0 mg/L, TDS 650 mg/L, EC 950 µS/cm.
3. Click **Save & Run AI Analysis**.
4. Verify result: Classified as **Poor Quality**, generates **Active Alert** for Acidic pH (&lt; 6.5) and lower dissolved oxygen.

### Test 8: Scenario 3 &mdash; High Turbidity Sample (WQ003)
1. Click **WQ003 (Scenario 3)**.
2. Review populated fields: Turbidity 15.0 NTU (elevated).
3. Click **Save & Run AI Analysis**.
4. Verify observation: Turbidity flagged as **Elevated** (&gt; 5.0 NTU).

### Test 9: Scenario 4 &mdash; High TDS Sample (WQ004)
1. Click **WQ004 (Scenario 4)**.
2. Review populated fields: TDS 1200 mg/L, EC 1800 µS/cm.
3. Click **Save & Run AI Analysis**.
4. Verify observation: High dissolved solids and conductivity warnings generated.

### Test 10: Scenario 5 &mdash; Low Dissolved Oxygen Sample (WQ005)
1. Click **WQ005 (Scenario 5)**.
2. Review populated fields: Dissolved Oxygen 2.5 mg/L, Temp 30°C.
3. Click **Save & Run AI Analysis**.
4. Verify observation: Critical low DO alert and aeration advisory generated.

### Test 11: Scenario 6 &mdash; Multiple Abnormal Parameters (WQ006)
1. Click **WQ006 (Scenario 6)**.
2. Review populated fields: pH 4.5, Turbidity 20.0 NTU, DO 2.0 mg/L, TDS 1500 mg/L, EC 2200 µS/cm.
3. Click **Save & Run AI Analysis**.
4. Verify result: **Potentially Contaminated**, High Severity Anomaly flagged, immediate laboratory confirmatory testing recommended.

### Test 12: Anomaly Detection Page
1. Navigate to `/anomalies`.
2. Inspect the list of samples with non-zero anomaly scores.
3. Filter by **High Severity** and verify WQ006 is present.

### Test 13: Interactive Map Exploration
1. Navigate to **Water Quality Map** (`/map`).
2. Click station markers (Sample Lake A, Industrial Zone, River Source B).
3. Verify station popup shows sample counts, anomaly counts, and repeated flags.

### Test 14: Historical Filtering
1. Navigate to **Historical Analysis** (`/history`).
2. Filter by location "Industrial Discharge Area".
3. Verify parameter trends over time.

### Test 15: Download PDF Report
1. On any sample detail page (e.g. `/samples/WQ001` or `/samples/WQ006`), click **Download PDF**.
2. Verify generated ReportLab PDF opens with tables, WQI scores, and disclaimer.

### Test 16: Export Samples to Excel
1. Navigate to **Reports & Exports** (`/reports`).
2. Click **Generate Excel Export**.
3. Verify downloaded `.xlsx` workbook contains all four formatted worksheets:
   - Water Samples
   - Quality Classification
   - Anomaly Detection
   - Alerts History

### Test 17: Update Alert Status
1. Navigate to **Alert Management** (`/alerts`).
2. On any Active alert, click **Review** or **Resolve**.
3. Verify status updates to "Under Review" or "Resolved" and persists in DB.

### Test 18: Input Validation Check
1. Go to **Manual Sample Entry**.
2. Enter an invalid pH of `16.0` or a negative turbidity `-5.0`.
3. Click Save & Analyze.
4. Verify frontend validation blocks submission and displays a clear error banner.

### Test 19: Full-Stack Integration
1. Edit a parameter threshold on `/settings`.
2. Re-analyze a sample on `/samples`.
3. Verify that changes propagate seamlessly between frontend and backend.

### Test 20: Database Persistence
1. Stop the FastAPI backend and restart it.
2. Refresh the frontend.
3. Confirm that all imported samples, alerts, and configurations persist in SQLite/PostgreSQL.
