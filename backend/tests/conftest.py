import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.utils.job_manager import JobManager


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("A2V_TEST_MODE", "1")

    from app.api import routes
    routes.job_manager = JobManager(str(tmp_path))

    from app.main import app

    return TestClient(app)
