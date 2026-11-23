import os

def test_export_excel_report(client):
    resp = client.get("/api/reports/export/excel")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(resp.content) > 1000

def test_generate_sample_pdf(client, auth_headers):
    # Retrieve a sample
    samples_resp = client.get("/api/samples/")
    assert samples_resp.status_code == 200
    samples = samples_resp.json()
    if len(samples) > 0:
        sample_id = samples[0]["id"]
        pdf_resp = client.get(f"/api/reports/sample/{sample_id}/pdf")
        assert pdf_resp.status_code == 200
        assert pdf_resp.headers["content-type"] == "application/pdf"
        assert len(pdf_resp.content) > 1000
