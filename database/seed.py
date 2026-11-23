import os
import sys
from datetime import datetime, timedelta

# Ensure backend directory is in python sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import pandas as pd
from app.core.config import settings
from app.core.security import get_password_hash
from app.database.base import Base
from app.database.session import get_engine, get_session
from app.models.user import User
from app.models.water_source import WaterSource
from app.models.water_sample import WaterSample
from app.models.water_parameter import WaterParameter
from app.services.analysis_service import run_full_sample_analysis
from app.ml.train import train_all_models

def seed_database():
    print("=" * 60)
    print("AquaSense AI - Database Seeding & Initialization")
    print("=" * 60)

    # 1. Initialize tables
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    db = get_session()

    try:
        # 2. Train ML models first so they are available
        print("[1/4] Ensuring trained ML models are ready...")
        csv_path = os.path.join(BACKEND_DIR, "data", "sample_water_quality.csv")
        train_res = train_all_models(csv_path)
        print(f"      Successfully trained models: {', '.join(train_res['trained_models'])}")

        # 3. Create Demonstration Users
        print("[2/4] Seeding demonstration users...")
        admin_user = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin_user:
            admin_user = User(
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                full_name="Dr. Elena Vance (Lead Environmental Analyst)",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            print(f"      Created Admin: {settings.ADMIN_EMAIL}")
        else:
            print(f"      Admin exists: {settings.ADMIN_EMAIL}")

        demo_user = db.query(User).filter(User.email == settings.DEMO_USER_EMAIL).first()
        if not demo_user:
            demo_user = User(
                email=settings.DEMO_USER_EMAIL,
                hashed_password=get_password_hash(settings.DEMO_USER_PASSWORD),
                full_name="Marcus Reed (Field Monitoring Specialist)",
                role="standard",
                is_active=True
            )
            db.add(demo_user)
            print(f"      Created Standard User: {settings.DEMO_USER_EMAIL}")
        else:
            print(f"      Demo user exists: {settings.DEMO_USER_EMAIL}")

        db.commit()
        db.refresh(admin_user)

        # 4. Seed Monitoring Locations (Indian Coordinates)
        print("[3/4] Seeding water source monitoring locations in India...")
        sources_data = [
            {"name": "Sample Lake A", "location_name": "Sample Lake A", "lat": 12.9784, "lon": 77.6200, "type": "lake", "desc": "Municipal recreational and ecological reservoir in Karnataka."},
            {"name": "Industrial Zone Canal", "location_name": "Industrial Zone", "lat": 13.0310, "lon": 77.5180, "type": "industrial", "desc": "Drainage canal buffering regional light manufacturing district."},
            {"name": "River Source B Basin", "location_name": "River Source B", "lat": 12.5180, "lon": 77.4420, "type": "river", "desc": "Highland river tributary providing seasonal surface runoff."},
            {"name": "Groundwater Aquifer 4", "location_name": "Groundwater Zone", "lat": 12.9250, "lon": 77.5930, "type": "groundwater", "desc": "Deep bedrock aquifer well cluster."},
            {"name": "Reservoir C Intake", "location_name": "Reservoir C", "lat": 12.8720, "lon": 77.3390, "type": "reservoir", "desc": "Protected drinking water catchment reservoir."},
            {"name": "Industrial Discharge Outfall", "location_name": "Industrial Discharge Area", "lat": 12.9100, "lon": 77.4950, "type": "industrial", "desc": "Permitted industrial discharge testing outfall."},
            {"name": "Agricultural Runoff Ditch", "location_name": "Agricultural District", "lat": 12.7230, "lon": 77.2910, "type": "other", "desc": "Irrigation return flow drainage canal."}
        ]

        location_map = {}
        for s in sources_data:
            existing_s = db.query(WaterSource).filter(WaterSource.name == s["name"]).first()
            if not existing_s:
                existing_s = WaterSource(
                    name=s["name"],
                    location_name=s["location_name"],
                    latitude=s["lat"],
                    longitude=s["lon"],
                    water_type=s["type"],
                    description=s["desc"]
                )
                db.add(existing_s)
                db.flush()
            location_map[s["location_name"]] = existing_s
            location_map[s["name"]] = existing_s

        db.commit()
        print(f"      Seeded {len(sources_data)} monitoring locations.")

        # 5. Seed Water Samples (Read from sample_water_quality.csv)
        print("[4/4] Seeding realistic water samples and running analytical pipelines...")
        df = pd.read_csv(csv_path)
        sample_count = 0
        analyzed_count = 0

        for _, row in df.iterrows():
            sid = str(row["sample_id"]).strip().upper()
            existing_sample = db.query(WaterSample).filter(WaterSample.sample_id == sid).first()
            if existing_sample:
                continue

            loc_name = str(row.get("location", "Sample Lake A"))
            src_name = str(row.get("water_source", loc_name))
            src_obj = location_map.get(src_name) or location_map.get(loc_name)

            date_val = datetime.utcnow() - timedelta(days=len(df) - sample_count)
            if "collection_date" in row and pd.notna(row["collection_date"]):
                try:
                    date_val = pd.to_datetime(row["collection_date"]).to_pydatetime()
                except Exception:
                    pass

            new_sample = WaterSample(
                sample_id=sid,
                water_source_id=src_obj.id if src_obj else None,
                water_source_name=src_name,
                location_name=loc_name,
                latitude=float(row.get("latitude", 37.77)) if pd.notna(row.get("latitude")) else (src_obj.latitude if src_obj else None),
                longitude=float(row.get("longitude", -122.42)) if pd.notna(row.get("longitude")) else (src_obj.longitude if src_obj else None),
                collection_date=date_val,
                notes=f"Illustrative screening sample: {row.get('quality_category', 'Monitored')}",
                created_by_id=admin_user.id
            )
            db.add(new_sample)
            db.flush()

            param = WaterParameter(
                sample_id=new_sample.id,
                ph=float(row["ph"]),
                turbidity=float(row["turbidity"]),
                temperature=float(row["temperature"]),
                dissolved_oxygen=float(row["dissolved_oxygen"]),
                tds=float(row["tds"]),
                electrical_conductivity=float(row["electrical_conductivity"]),
                hardness=float(row["hardness"]) if "hardness" in row and pd.notna(row["hardness"]) else None,
                chloramines=float(row["chloramines"]) if "chloramines" in row and pd.notna(row["chloramines"]) else None,
                sulfate=float(row["sulfate"]) if "sulfate" in row and pd.notna(row["sulfate"]) else None,
                organic_carbon=float(row["organic_carbon"]) if "organic_carbon" in row and pd.notna(row["organic_carbon"]) else None,
            )
            db.add(param)
            db.commit()
            sample_count += 1

            # Run full analytical pipeline (Classification, Anomalies, Alerts, Recommendations)
            try:
                run_full_sample_analysis(new_sample.id, db)
                analyzed_count += 1
            except Exception as e:
                print(f"      Warning: Analysis failed for {sid}: {e}")

        print(f"      Inserted {sample_count} samples. Successfully analyzed {analyzed_count} samples.")
        print("=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"ERROR during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
