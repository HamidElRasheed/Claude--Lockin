import os
import tempfile
from pathlib import Path

# Tests use their own throwaway SQLite file, never the dev database.
# Must be set before app.config is imported.
_TEST_DB = Path(tempfile.gettempdir()) / "lockin-test.db"
_TEST_DB.unlink(missing_ok=True)
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB.as_posix()}"
