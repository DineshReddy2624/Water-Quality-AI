# AquaSense AI &mdash; Database Schema Documentation

## Database Engine
- **Primary Engine**: PostgreSQL (15+)
- **Fallback Engine**: SQLite (for zero-dependency standalone local developer evaluation)
- **ORM**: SQLAlchemy 2.0+ with Declarative Base

---

## Entity Relationship Overview

```
 [users] ────< [water_samples] >──── [water_parameters] (1:1)
                       │
                       ├────< [analysis_results] (1:1)
                       ├────< [anomaly_records] (1:M)
                       ├────< [alerts] (1:M)
                       ├────< [recommendations] (1:M)
                       └────< [reports] (1:M)

 [water_sources] ────< [water_samples]
                 ────< [sensor_devices]
```

---

## Table Schemas

### 1. `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | User identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Login email address |
| `hashed_password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `full_name` | VARCHAR(255) | NULLABLE | Display name |
| `role` | VARCHAR(50) | NOT NULL, DEFAULT 'standard' | 'admin' or 'standard' |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account active flag |
| `created_at` | DATETIME | NOT NULL | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL | Modification timestamp |

### 2. `water_sources`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Source identifier |
| `name` | VARCHAR(255) | UNIQUE, NOT NULL | Water body name |
| `location_name` | VARCHAR(255) | NOT NULL, INDEX | Regional station/catchment name |
| `latitude` | FLOAT | NULLABLE | Latitude in decimal degrees |
| `longitude` | FLOAT | NULLABLE | Longitude in decimal degrees |
| `water_type` | VARCHAR(100) | NOT NULL | 'lake', 'river', 'groundwater', etc. |
| `description` | TEXT | NULLABLE | Site context notes |

### 3. `water_samples`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Primary surrogate key |
| `sample_id` | VARCHAR(100) | UNIQUE, NOT NULL, INDEX | Business sample code (e.g. WQ001) |
| `water_source_id` | INTEGER | FOREIGN KEY (`water_sources.id`) | Linked source |
| `water_source_name`| VARCHAR(255) | NOT NULL | Redundant source name |
| `location_name` | VARCHAR(255) | NOT NULL, INDEX | Sampling location |
| `latitude` | FLOAT | NULLABLE | Sample GPS latitude |
| `longitude` | FLOAT | NULLABLE | Sample GPS longitude |
| `collection_date`| DATETIME | NOT NULL | Field collection timestamp |
| `created_by_id` | INTEGER | FOREIGN KEY (`users.id`) | Submitting user |

### 4. `water_parameters`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY | Identifier |
| `sample_id` | INTEGER | FOREIGN KEY (`water_samples.id`), UNIQUE | 1:1 linked sample |
| `ph` | FLOAT | NOT NULL | pH value (0 - 14) |
| `turbidity` | FLOAT | NOT NULL | Turbidity in NTU |
| `temperature` | FLOAT | NOT NULL | Water temperature in °C |
| `dissolved_oxygen` | FLOAT | NOT NULL | Dissolved oxygen in mg/L |
| `tds` | FLOAT | NOT NULL | Total dissolved solids in mg/L |
| `electrical_conductivity` | FLOAT | NOT NULL | Conductivity in µS/cm |
| `hardness` | FLOAT | NULLABLE | Total hardness in mg/L |
| `chloramines` | FLOAT | NULLABLE | Chloramines in mg/L |
| `sulfate` | FLOAT | NULLABLE | Sulfate in mg/L |
| `organic_carbon` | FLOAT | NULLABLE | Total organic carbon in mg/L |

### 5. `analysis_results`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY |
| `sample_id` | INTEGER | Linked sample (UNIQUE) |
| `predicted_category` | VARCHAR(100) | 'Good Quality', 'Moderate Quality', 'Poor Quality', 'Potentially Contaminated' |
| `confidence_score` | FLOAT | Model confidence probability (0.0 - 1.0) |
| `model_used` | VARCHAR(100) | Classification model description |
| `wqi_score` | FLOAT | Composite Water Quality Index (0 - 100) |
| `observations_json` | TEXT | Serialized parameter-by-parameter analysis |
| `recommendations_json`| TEXT | Serialized prescriptive recommendations |
| `probabilities_json` | TEXT | Class probability distribution dictionary |

### 6. `anomaly_records`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY |
| `sample_id` | INTEGER | Linked sample |
| `is_anomaly` | BOOLEAN | True if outlier detected |
| `anomaly_score` | FLOAT | Normalized score (0.0 - 1.0) |
| `severity` | VARCHAR(50) | 'Normal', 'Low', 'Medium', 'High' |
| `detected_method` | VARCHAR(100)| 'Isolation Forest + Threshold Rules' |

### 7. `alerts`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY |
| `alert_id` | VARCHAR(50) | Business code (e.g. ALT-WQ002-PH) |
| `sample_id` | INTEGER | Linked sample |
| `location_name` | VARCHAR(255) | Station name |
| `abnormal_parameter`| VARCHAR(100)| Breached parameter |
| `measured_value` | FLOAT | Recorded measurement |
| `threshold_value`| VARCHAR(100)| Reference range |
| `severity` | VARCHAR(50) | 'Low', 'Medium', 'High' |
| `status` | VARCHAR(50) | 'Active', 'Under Review', 'Resolved' |

### 8. `recommendations`
Stores prioritized remediation steps (Sampling, Calibration, Investigation, Laboratory, Monitoring).

### 9. `reports`
Tracks generated PDF and Excel documents with file path and file size.

### 10. `sensor_devices`
Maintains optional IoT sensor stations, IP addresses, and ping telemetry.
