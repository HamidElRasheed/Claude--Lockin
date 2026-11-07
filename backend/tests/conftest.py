import os
import tempfile
from pathlib import Path

import pytest

# Tests use their own throwaway SQLite file, never the dev database.
# Must be set before app.config is imported.
# One file per test process, so several agents/worktrees can run pytest at the same time.
_TEST_DB = Path(tempfile.gettempdir()) / f"lockin-test-{os.getpid()}.db"
_TEST_DB.unlink(missing_ok=True)
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB.as_posix()}"

from app.db import Base, engine, init_db  # noqa: E402


@pytest.fixture(autouse=True)
def clean_db():
    """Every test starts with empty tables."""
    init_db()
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    yield
