from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class PreprocessingSummary(BaseModel):
    original_row_count: int
    cleaned_row_count: int
    missing_values_handled: int
    duplicate_rows_removed: int
    invalid_values_identified: int
    outliers_detected: int

class DatasetPreviewResponse(BaseModel):
    filename: str
    file_id: str
    row_count: int
    column_count: int
    columns: List[str]
    missing_values: Dict[str, int]
    duplicate_count: int
    validation_errors: List[str]
    preview_rows: List[Dict[str, Any]]
    preprocessing_summary: PreprocessingSummary

class DatasetImportRequest(BaseModel):
    file_id: str
    auto_analyze: bool = True
    default_location: Optional[str] = None

class DatasetImportResponse(BaseModel):
    message: str
    imported_count: int
    skipped_count: int
    sample_ids: List[str]
