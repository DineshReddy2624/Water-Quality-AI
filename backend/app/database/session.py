import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

engine = None
SessionLocal = sessionmaker(autocommit=False, autoflush=False)

def get_engine():
    global engine, SessionLocal
    if engine is not None:
        return engine

    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    # First attempt: Target PostgreSQL URL
    try:
        test_engine = create_engine(
            db_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3} if "postgresql" in db_url else {}
        )
        with test_engine.connect() as conn:
            logger.info("Successfully connected to primary database: %s", db_url)
        engine = test_engine
    except Exception as e:
        if settings.USE_SQLITE_FALLBACK:
            logger.warning(
                "Primary database (%s) connection failed: %s. Falling back to local SQLite: %s",
                db_url,
                str(e),
                settings.SQLITE_DB_URL
            )
            engine = create_engine(
                settings.SQLITE_DB_URL,
                connect_args={"check_same_thread": False}
            )
        else:
            raise e

    SessionLocal.configure(bind=engine)
    return engine

# Ensure engine and SessionLocal are initialized on import
get_engine()

def get_session() -> Session:
    global SessionLocal
    if engine is None:
        get_engine()
    return SessionLocal()

def get_db():
    db = get_session()
    try:
        yield db
    finally:
        db.close()
