# AquaSense AI &mdash; API Documentation

## Overview
AquaSense AI provides a RESTful API powered by **FastAPI**, **Pydantic v2**, and **SQLAlchemy**.
All API routes are prefixed under `/api` and return standardized JSON schemas.

- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Specifications**: `http://localhost:8000/redoc`

---

## Authentication Endpoints

### 1. Register User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "analyst@aquasense.org",
    "password": "Password123!",
    "full_name": "Dr. Sarah Lin",
    "role": "standard"
  }
  ```
- **Response**: `201 Created` with User object.

### 2. Login User
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@aquasense.org",
    "password": "AdminPassword123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": { ... }
  }
  ```

### 3. Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Header**: `Authorization: Bearer <token>`
- **Response**: Current authenticated user profile.

---

## Dashboard & Analytics

### 1. Dashboard Summary
- **Endpoint**: `GET /api/dashboard/summary`
- **Response**: Aggregated KPI counts:
  - `total_samples`
  - `total_locations`
  - `good_quality_count`
  - `moderate_quality_count`
  - `poor_quality_count`
  - `potentially_contaminated_count`
  - `total_anomalies`
  - `active_alerts`
  - Mean values for pH, Turbidity, DO, TDS, EC, Temperature.

### 2. Time-series Trends
- **Endpoint**: `GET /api/dashboard/trends`
- **Response**: Chronological water quality readings and WQI scores.

---

## Water Samples Management

### 1. Create Water Sample
- **Endpoint**: `POST /api/samples/?auto_analyze=true`
- **Request Body**:
  ```json
  {
    "sample_id": "WQ001",
    "water_source_name": "Sample Lake A",
    "location_name": "Sample Lake A",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "parameters": {
      "ph": 7.2,
      "turbidity": 1.5,
      "temperature": 25.0,
      "dissolved_oxygen": 7.8,
      "tds": 280.0,
      "electrical_conductivity": 450.0,
      "hardness": 120.0,
      "chloramines": 2.1,
      "sulfate": 180.0,
      "organic_carbon": 3.2
    }
  }
  ```
- **Response**: `201 Created` with complete sample details, AI classification, anomaly score, generated alerts, and recommendations.

### 2. List Samples
- **Endpoint**: `GET /api/samples/`
- **Query Parameters**:
  - `location`: filter by location name
  - `category`: filter by `Good Quality`, `Moderate Quality`, `Poor Quality`, `Potentially Contaminated`
  - `search`: search term
  - `limit`: default 100
  - `offset`: default 0

### 3. Get Sample Detail
- **Endpoint**: `GET /api/samples/{sample_id}`
- **Response**: Sample record with nested parameters, classification observations, anomaly metrics, and alerts.

### 4. Update Sample
- **Endpoint**: `PUT /api/samples/{sample_id}`
- **Behavior**: Updates parameters and re-triggers analysis.

### 5. Delete Sample
- **Endpoint**: `DELETE /api/samples/{sample_id}`

---

## Datasets Ingestion

### 1. Upload & Preview
- **Endpoint**: `POST /api/datasets/upload`
- **Content-Type**: `multipart/form-data`
- **Behavior**: Validates file format (.csv, .xlsx, .xls), checks row/column counts, missing values, duplicates, and returns preview.

### 2. Confirm Import
- **Endpoint**: `POST /api/datasets/{file_id}/import`
- **Request Body**:
  ```json
  {
    "file_id": "3b29...csv",
    "auto_analyze": true
  }
  ```
- **Response**: Count of imported samples, skipped duplicates, and generated sample IDs.

---

## Machine Learning & Anomaly Detection

### 1. Models Metadata
- **Endpoint**: `GET /api/ml/models`
- **Response**: List of trained models, feature names, and evaluation summaries.

### 2. Train Models
- **Endpoint**: `POST /api/ml/train`
- **Behavior**: Trains Random Forest, XGBoost, Decision Tree, Logistic Regression, Isolation Forest, and K-Means.

### 3. Anomaly Detection Records
- **Endpoint**: `GET /api/anomalies/`
- **Query Parameters**: `only_anomalies=true`, `severity=High`

---

## Alerts & Reports

### 1. List Alerts
- **Endpoint**: `GET /api/alerts/`
- **Query Parameters**: `status=Active`, `severity=High`

### 2. Update Alert Status
- **Endpoint**: `PUT /api/alerts/{alert_id}/status`
- **Body**: `{"status": "Under Review"}` or `{"status": "Resolved"}`

### 3. Download Sample PDF
- **Endpoint**: `GET /api/reports/sample/{sample_id}/pdf`

### 4. Export Excel
- **Endpoint**: `GET /api/reports/export/excel`
