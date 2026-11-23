import os
import uuid
import pandas as pd
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db, get_optional_user, get_current_user
from app.models.user import User
from app.models.water_sample import WaterSample
from app.models.water_parameter import WaterParameter
from app.models.water_source import WaterSource
from app.schemas.dataset import DatasetPreviewResponse, DatasetImportRequest, DatasetImportResponse, PreprocessingSummary
from app.ml.preprocessing import clean_water_dataframe, CORE_FEATURE_COLUMNS, FEATURE_COLUMNS
from app.services.analysis_service import run_full_sample_analysis

router = APIRouter(prefix="/datasets", tags=["Datasets"])

ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/upload", response_model=DatasetPreviewResponse)
async def upload_dataset(
    file: UploadFile = File(...)
):
    # Validate extension
    filename = file.filename or "uploaded_dataset.csv"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 10 MB."
        )

    # Save to uploads dir with unique id
    file_id = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, file_id)
    with open(saved_path, "wb") as f:
        f.write(content)

    # Load dataframe
    try:
        if ext == ".csv":
            raw_df = pd.read_csv(saved_path)
        else:
            raw_df = pd.read_excel(saved_path)
    except Exception as e:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse uploaded dataset: {str(e)}"
        )

    # Run data preprocessing and validation
    cleaned_df, summary = clean_water_dataframe(raw_df)

    validation_errors = []
    # Check for required core parameters
    for col in CORE_FEATURE_COLUMNS:
        if col not in cleaned_df.columns:
            validation_errors.append(f"Missing core water quality parameter column: '{col}'")

    missing_dict = {col: int(raw_df[col].isna().sum()) for col in raw_df.columns if col in raw_df}

    # Generate preview rows (first 10 rows)
    preview_rows = []
    for _, row in cleaned_df.head(10).iterrows():
        row_dict = {}
        for k, v in row.items():
            if pd.isna(v):
                row_dict[k] = None
            elif isinstance(v, (int, float)):
                row_dict[k] = round(float(v), 2)
            else:
                row_dict[k] = str(v)
        preview_rows.append(row_dict)

    return {
        "filename": filename,
        "file_id": file_id,
        "row_count": len(raw_df),
        "column_count": len(raw_df.columns),
        "columns": list(raw_df.columns),
        "missing_values": missing_dict,
        "duplicate_count": summary["duplicate_rows_removed"],
        "validation_errors": validation_errors,
        "preview_rows": preview_rows,
        "preprocessing_summary": summary
    }

@router.get("/{file_id}/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(file_id: str):
    file_path = os.path.join(settings.UPLOAD_DIR, file_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Uploaded dataset file not found or expired.")

    ext = os.path.splitext(file_id)[1].lower()
    if ext == ".csv":
        raw_df = pd.read_csv(file_path)
    else:
        raw_df = pd.read_excel(file_path)

    cleaned_df, summary = clean_water_dataframe(raw_df)
    validation_errors = []
    for col in CORE_FEATURE_COLUMNS:
        if col not in cleaned_df.columns:
            validation_errors.append(f"Missing core column: '{col}'")

    missing_dict = {col: int(raw_df[col].isna().sum()) for col in raw_df.columns if col in raw_df}
    preview_rows = [
        {k: (round(float(v), 2) if isinstance(v, (int, float)) and not pd.isna(v) else (None if pd.isna(v) else str(v)))
         for k, v in row.items()}
        for _, row in cleaned_df.head(10).iterrows()
    ]

    return {
        "filename": file_id,
        "file_id": file_id,
        "row_count": len(raw_df),
        "column_count": len(raw_df.columns),
        "columns": list(raw_df.columns),
        "missing_values": missing_dict,
        "duplicate_count": summary["duplicate_rows_removed"],
        "validation_errors": validation_errors,
        "preview_rows": preview_rows,
        "preprocessing_summary": summary
    }

@router.post("/{file_id}/import", response_model=DatasetImportResponse)
def import_dataset(
    file_id: str,
    import_req: DatasetImportRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    file_path = os.path.join(settings.UPLOAD_DIR, file_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File to import does not exist.")

    ext = os.path.splitext(file_id)[1].lower()
    try:
        if ext == ".csv":
            raw_df = pd.read_csv(file_path)
        else:
            raw_df = pd.read_excel(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    cleaned_df, summary = clean_water_dataframe(raw_df)

    imported_count = 0
    skipped_count = 0
    sample_ids = []

    for idx, row in cleaned_df.iterrows():
        # Derive sample ID
        sid = str(row.get("sample_id", "")).strip().upper()
        if not sid or sid == "NAN" or sid == "":
            sid = f"IMP{datetime.utcnow().strftime('%m%d')}{idx:04d}"

        # If sample_id already exists in database, skip or rename
        existing = db.query(WaterSample).filter(WaterSample.sample_id == sid).first()
        if existing:
            skipped_count += 1
            continue

        loc_name = str(row.get("location", row.get("location_name", import_req.default_location or "General Monitoring Station"))).strip()
        src_name = str(row.get("water_source", row.get("water_source_name", loc_name))).strip()

        # Find or create location
        source = db.query(WaterSource).filter(WaterSource.name == src_name).first()
        lat = float(row.get("latitude")) if ("latitude" in row and pd.notna(row["latitude"])) else None
        lon = float(row.get("longitude")) if ("longitude" in row and pd.notna(row["longitude"])) else None

        if not source:
            source = WaterSource(
                name=src_name,
                location_name=loc_name,
                latitude=lat,
                longitude=lon
            )
            db.add(source)
            db.flush()

        date_val = datetime.utcnow()
        if "collection_date" in row and pd.notna(row["collection_date"]):
            try:
                date_val = pd.to_datetime(row["collection_date"]).to_pydatetime()
            except Exception:
                date_val = datetime.utcnow()

        sample = WaterSample(
            sample_id=sid,
            water_source_id=source.id,
            water_source_name=src_name,
            location_name=loc_name,
            latitude=lat or source.latitude,
            longitude=lon or source.longitude,
            collection_date=date_val,
            created_by_id=current_user.id if current_user else None
        )
        db.add(sample)
        db.flush()

        param = WaterParameter(
            sample_id=sample.id,
            ph=float(row.get("ph", 7.0)),
            turbidity=float(row.get("turbidity", 2.0)),
            temperature=float(row.get("temperature", 22.0)),
            dissolved_oxygen=float(row.get("dissolved_oxygen", 7.0)),
            tds=float(row.get("tds", 300.0)),
            electrical_conductivity=float(row.get("electrical_conductivity", 450.0)),
            hardness=float(row.get("hardness")) if ("hardness" in row and pd.notna(row["hardness"])) else None,
            chloramines=float(row.get("chloramines")) if ("chloramines" in row and pd.notna(row["chloramines"])) else None,
            sulfate=float(row.get("sulfate")) if ("sulfate" in row and pd.notna(row["sulfate"])) else None,
            organic_carbon=float(row.get("organic_carbon")) if ("organic_carbon" in row and pd.notna(row["organic_carbon"])) else None,
        )
        db.add(param)
        imported_count += 1
        sample_ids.append(sid)

    db.commit()

    # Auto analyze if requested
    if import_req.auto_analyze:
        for sid in sample_ids:
            s_obj = db.query(WaterSample).filter(WaterSample.sample_id == sid).first()
            if s_obj:
                try:
                    run_full_sample_analysis(s_obj.id, db)
                except Exception:
                    pass

    return {
        "message": f"Successfully imported {imported_count} samples ({skipped_count} skipped duplicates).",
        "imported_count": imported_count,
        "skipped_count": skipped_count,
        "sample_ids": sample_ids
    }
