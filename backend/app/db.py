from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

# check_same_thread is SQLite-only; ignored for PostgreSQL later.
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    # Hackathon: create tables directly. Add Alembic migrations when moving to PostgreSQL.
    from app import models  # noqa: F401  (registers models)

    Base.metadata.create_all(bind=engine)
    _add_missing_columns()


# Columns added after the first release. create_all() never alters existing tables,
# so an existing SQLite file gets them here. (Alembic replaces this later.)
_NEW_COLUMNS = {
    "daily_logs": {"satisfaction": "INTEGER", "score": "FLOAT", "suggestion": "TEXT"},
}


def _add_missing_columns() -> None:
    with engine.begin() as conn:
        for table, columns in _NEW_COLUMNS.items():
            existing = {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")}
            for name, sql_type in columns.items():
                if name not in existing:
                    conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {name} {sql_type}")
