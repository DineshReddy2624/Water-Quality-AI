import os
from datetime import datetime
from typing import List, Any
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_samples_excel_report(samples: List[Any], file_path: str) -> str:
    """
    Generates a structured, multi-sheet Excel workbook covering:
    - Sheet 1: Water Samples & Parameters
    - Sheet 2: Analysis & Classification Results
    - Sheet 3: Anomaly Records
    - Sheet 4: Active Alerts
    """
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    wb = openpyxl.Workbook()
    
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    # ------------------ SHEET 1: Samples & Parameters ------------------
    ws1 = wb.active
    ws1.title = "Water Samples"
    headers1 = [
        "Sample ID", "Water Source", "Location", "Latitude", "Longitude",
        "Collection Date", "pH", "Turbidity (NTU)", "Temperature (°C)",
        "Dissolved Oxygen (mg/L)", "TDS (mg/L)", "EC (µS/cm)",
        "Hardness", "Chloramines", "Sulfate", "Organic Carbon", "Notes"
    ]
    ws1.append(headers1)
    
    for s in samples:
        p = s.parameters
        ws1.append([
            s.sample_id,
            s.water_source_name,
            s.location_name,
            s.latitude if s.latitude else "N/A",
            s.longitude if s.longitude else "N/A",
            s.collection_date.strftime("%Y-%m-%d %H:%M") if s.collection_date else "N/A",
            p.ph if p else "N/A",
            p.turbidity if p else "N/A",
            p.temperature if p else "N/A",
            p.dissolved_oxygen if p else "N/A",
            p.tds if p else "N/A",
            p.electrical_conductivity if p else "N/A",
            p.hardness if p and p.hardness is not None else "N/A",
            p.chloramines if p and p.chloramines is not None else "N/A",
            p.sulfate if p and p.sulfate is not None else "N/A",
            p.organic_carbon if p and p.organic_carbon is not None else "N/A",
            s.notes or ""
        ])

    # ------------------ SHEET 2: Analysis Results ------------------
    ws2 = wb.create_sheet(title="Quality Classification")
    headers2 = ["Sample ID", "Location", "Predicted Category", "WQI Score", "Confidence", "Model Used", "Analysis Summary"]
    ws2.append(headers2)
    for s in samples:
        a = s.analysis
        if a:
            ws2.append([
                s.sample_id,
                s.location_name,
                a.predicted_category,
                a.wqi_score if a.wqi_score else "N/A",
                f"{int(a.confidence_score * 100)}%" if a.confidence_score else "N/A",
                a.model_used,
                a.summary or ""
            ])

    # ------------------ SHEET 3: Anomaly Records ------------------
    ws3 = wb.create_sheet(title="Anomaly Detection")
    headers3 = ["Sample ID", "Location", "Is Anomaly", "Severity", "Anomaly Score", "Method", "Notes"]
    ws3.append(headers3)
    for s in samples:
        for anom in s.anomalies:
            ws3.append([
                s.sample_id,
                s.location_name,
                "YES" if anom.is_anomaly else "NO",
                anom.severity,
                round(anom.anomaly_score, 4),
                anom.detected_method,
                anom.notes or ""
            ])

    # ------------------ SHEET 4: Alerts History ------------------
    ws4 = wb.create_sheet(title="Alerts History")
    headers4 = ["Alert ID", "Sample ID", "Location", "Parameter", "Measured", "Threshold", "Severity", "Status", "Message", "Action"]
    ws4.append(headers4)
    for s in samples:
        for alt in s.alerts:
            ws4.append([
                alt.alert_id,
                s.sample_id,
                alt.location_name,
                alt.abnormal_parameter,
                alt.measured_value,
                alt.threshold_value,
                alt.severity,
                alt.status,
                alt.alert_message,
                alt.suggested_action
            ])

    # Style all sheets: header row and auto column widths
    for sheet in wb.worksheets:
        for col_idx in range(1, sheet.max_column + 1):
            cell = sheet.cell(row=1, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = align_center
            
            # Auto-fit column widths
            max_len = max(len(str(sheet.cell(row=r, column=col_idx).value or '')) for r in range(1, sheet.max_row + 1))
            col_letter = get_column_letter(col_idx)
            sheet.column_dimensions[col_letter].width = max(max_len + 4, 12)

        for row in sheet.iter_rows(min_row=2, max_row=sheet.max_row, min_col=1, max_col=sheet.max_column):
            for cell in row:
                cell.border = thin_border
                cell.alignment = align_left

    wb.save(file_path)
    return file_path
