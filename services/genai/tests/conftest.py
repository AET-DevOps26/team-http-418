import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
for name, value in {
    "COURSES_DB_NAME": "test",
    "DB_USER": "test",
    "DB_PASS": "test",
    "DB_HOST": "localhost",
    "DB_PORT": "5432",
}.items():
    os.environ.setdefault(name, value)
