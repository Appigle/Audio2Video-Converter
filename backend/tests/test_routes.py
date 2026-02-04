from pathlib import Path


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ffmpeg_available" in data


def test_convert_endpoint_returns_resource_base_name(client, tmp_path):
    response = client.post(
        "/api/convert",
        files={"audio": ("meeting.m4a", b"data", "audio/mp4")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["job_id"].startswith("job_")
    assert data["resource_base_name"].startswith("meeting_")
    assert data["video_url"].startswith("/api/jobs/")


def test_batch_convert_returns_jobs(client):
    response = client.post(
        "/api/batch/convert",
        files=[
            ("audios", ("one.m4a", b"one", "audio/mp4")),
            ("audios", ("two.m4a", b"two", "audio/mp4")),
        ],
    )
    assert response.status_code == 200
    data = response.json()
    assert "batch_id" in data
    assert len(data["jobs"]) == 2
    assert all("resource_base_name" in job for job in data["jobs"])


def test_missing_video_returns_404(client):
    response = client.get("/api/jobs/does-not-exist/video")
    assert response.status_code == 404
