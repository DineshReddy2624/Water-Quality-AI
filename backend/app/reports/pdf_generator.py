import os
import json
from datetime import datetime
from typing import Dict, Any, Optional, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from app.core.config import settings

def generate_sample_pdf_report(sample: Any, analysis: Optional[Any], anomalies: List[Any], file_path: str) -> str:
    """
    Generates a professional PDF report for an individual water sample using ReportLab.
    Includes measurements, screening classification, anomaly analysis, observations,
    tailored recommendations, and educational disclaimer.
    """
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    doc = SimpleDocTemplate(file_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#0D9488'),
        spaceAfter=14
    )
    heading2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155'),
        leading=12
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=colors.HexColor('#64748B'),
        leading=11
    )

    # 1. Header
    story.append(Paragraph("AquaSense AI &mdash; Water Quality & Contamination Analysis Report", title_style))
    story.append(Paragraph(f"Sample Screening & Decision-Support System | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0D9488'), spaceAfter=12))

    # 2. Metadata Table
    meta_data = [
        [
            Paragraph("<b>Sample ID:</b>", body_style), Paragraph(str(sample.sample_id), body_style),
            Paragraph("<b>Collection Date:</b>", body_style), Paragraph(sample.collection_date.strftime('%Y-%m-%d %H:%M') if sample.collection_date else "N/A", body_style)
        ],
        [
            Paragraph("<b>Water Source:</b>", body_style), Paragraph(str(sample.water_source_name), body_style),
            Paragraph("<b>Location:</b>", body_style), Paragraph(str(sample.location_name), body_style)
        ],
        [
            Paragraph("<b>GPS Coordinates:</b>", body_style), 
            Paragraph(f"{sample.latitude:.4f}, {sample.longitude:.4f}" if sample.latitude and sample.longitude else "Manual Entry (No GPS)", body_style),
            Paragraph("<b>Analyzed At:</b>", body_style), 
            Paragraph(analysis.created_at.strftime('%Y-%m-%d %H:%M') if analysis else "Pending", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[100, 170, 100, 170])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 3. Overall Classification Card
    cat = analysis.predicted_category if analysis else "Unclassified"
    wqi = analysis.wqi_score if analysis and analysis.wqi_score else "N/A"
    conf = f"{int(analysis.confidence_score * 100)}%" if analysis and analysis.confidence_score else "N/A"
    
    bg_color = colors.HexColor('#DCFCE7') if "Good" in cat else (
        colors.HexColor('#FEF9C3') if "Moderate" in cat else (
            colors.HexColor('#FEE2E2') if "Contaminated" in cat else colors.HexColor('#FFEDD5')
        )
    )

    class_data = [
        [Paragraph(f"<b>Overall Quality Category:</b> <font size=12 color='#0F172A'>{cat}</font>", body_style),
         Paragraph(f"<b>Water Quality Index (WQI):</b> {wqi}/100", body_style),
         Paragraph(f"<b>Model Confidence:</b> {conf}", body_style)]
    ]
    class_table = Table(class_data, colWidths=[240, 150, 150])
    class_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_color),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#94A3B8')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(class_table)
    story.append(Spacer(1, 10))

    # 4. Water Parameters Measurement Table
    story.append(Paragraph("Laboratory & Field Parameter Measurements", heading2_style))
    p = sample.parameters
    param_rows = [
        ["Parameter", "Measured Value", "Screening Baseline", "Parameter Status"]
    ]
    if p:
        param_rows.append(["pH", f"{p.ph:.2f}", "6.5 - 8.5", "Normal" if 6.5 <= p.ph <= 8.5 else "Abnormal"])
        param_rows.append(["Turbidity", f"{p.turbidity:.2f} NTU", "< 5.0 NTU", "Normal" if p.turbidity <= 5.0 else "Elevated"])
        param_rows.append(["Temperature", f"{p.temperature:.1f} °C", "15.0 - 28.0 °C", "Normal" if 15.0 <= p.temperature <= 28.0 else "Abnormal"])
        param_rows.append(["Dissolved Oxygen", f"{p.dissolved_oxygen:.2f} mg/L", ">= 6.0 mg/L", "Normal" if p.dissolved_oxygen >= 6.0 else "Low"])
        param_rows.append(["Total Dissolved Solids (TDS)", f"{p.tds:.1f} mg/L", "< 500.0 mg/L", "Normal" if p.tds <= 500.0 else "Elevated"])
        param_rows.append(["Electrical Conductivity", f"{p.electrical_conductivity:.1f} µS/cm", "< 750.0 µS/cm", "Normal" if p.electrical_conductivity <= 750.0 else "Elevated"])
        if p.hardness is not None:
            param_rows.append(["Hardness", f"{p.hardness:.1f} mg/L", "< 200.0 mg/L", "Normal" if p.hardness <= 200.0 else "Elevated"])
        if p.chloramines is not None:
            param_rows.append(["Chloramines", f"{p.chloramines:.2f} mg/L", "< 3.0 mg/L", "Normal" if p.chloramines <= 3.0 else "Elevated"])
        if p.sulfate is not None:
            param_rows.append(["Sulfate", f"{p.sulfate:.1f} mg/L", "< 250.0 mg/L", "Normal" if p.sulfate <= 250.0 else "Elevated"])
        if p.organic_carbon is not None:
            param_rows.append(["Total Organic Carbon", f"{p.organic_carbon:.2f} mg/L", "< 5.0 mg/L", "Normal" if p.organic_carbon <= 5.0 else "Elevated"])

    p_table = Table(param_rows, colWidths=[160, 120, 130, 130])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 10))

    # 5. Anomaly Detection & Screening Observations
    story.append(Paragraph("Anomaly Detection & Parameter Observations", heading2_style))
    if anomalies:
        for a in anomalies:
            severity_col = colors.HexColor('#DC2626') if a.severity == "High" else (
                colors.HexColor('#F59E0B') if a.severity == "Medium" else colors.HexColor('#3B82F6')
            )
            story.append(Paragraph(
                f"<b>Anomaly Status:</b> {'ANOMALY DETECTED' if a.is_anomaly else 'NORMAL'} &nbsp;|&nbsp; "
                f"<b>Severity:</b> <font color='{severity_col}'><b>{a.severity}</b></font> &nbsp;|&nbsp; "
                f"<b>Score:</b> {a.anomaly_score:.2f} &nbsp;|&nbsp; "
                f"<b>Detection Method:</b> {a.detected_method}",
                body_style
            ))
            if a.notes:
                story.append(Paragraph(f"<i>{a.notes}</i>", body_style))
    else:
        story.append(Paragraph("No anomalies or statistical outliers flagged for this sample.", body_style))

    # 6. Actionable Recommendations
    story.append(Spacer(1, 6))
    story.append(Paragraph("Actionable Recommendations & Next Steps", heading2_style))
    recs = []
    if analysis and analysis.recommendations_json:
        try:
            recs = json.loads(analysis.recommendations_json)
        except Exception:
            recs = []
    if not recs:
        recs = [{"title": "Continue Routine Baseline Monitoring", "description": "Maintain scheduled sampling according to site water management plan."}]

    for idx, r in enumerate(recs, 1):
        story.append(Paragraph(f"<b>{idx}. {r.get('title', 'Recommendation')}</b>", body_style))
        story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;{r.get('description', '')}", body_style))
        story.append(Spacer(1, 3))

    # 7. Regulatory Limitations and Disclaimer
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor('#94A3B8'), spaceAfter=8))
    disclaimer_text = (
        "<b>IMPORTANT NOTICE & REGULATORY DISCLAIMER:</b> "
        "This application is an educational screening and decision-support system. It does not certify "
        "drinking-water safety or identify specific hazardous contaminants or pathogens without certified "
        "laboratory testing. Configured thresholds are illustrative screening baselines and must be validated "
        "against applicable official drinking water or environmental discharge standards."
    )
    story.append(Paragraph(disclaimer_text, disclaimer_style))

    doc.build(story)
    return file_path
