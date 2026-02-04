import json
from pathlib import Path

from app.utils.job_manager import JobManager


def test_job_manager_creates_meta_and_paths(tmp_path: Path):
    manager = JobManager(str(tmp_path))
    job_id = manager.create_job("Meeting Notes.m4a")

    job_dir = manager.get_job_dir(job_id)
    assert job_dir.exists()

    meta_path = job_dir / "job_meta.json"
    assert meta_path.exists()

    meta = json.loads(meta_path.read_text())
    assert meta["audio_base_name"] == "Meeting_Notes"
    assert meta["audio_ext"] == ".m4a"
    assert meta["resource_base_name"].startswith("Meeting_Notes_")

    assert manager.get_source_audio_path(job_id).name == f"{meta['resource_base_name']}.m4a"
    assert manager.get_rendered_video_path(job_id).name == f"{meta['resource_base_name']}.mp4"
    assert manager.get_transcript_segments_path(job_id).name == f"{meta['resource_base_name']}.json"
    assert manager.get_subtitles_path(job_id).name == f"{meta['resource_base_name']}.vtt"


def test_job_manager_sanitizes_audio_name(tmp_path: Path):
    manager = JobManager(str(tmp_path))
    job_id = manager.create_job("  $$$.m4a")
    meta = json.loads((manager.get_job_dir(job_id) / "job_meta.json").read_text())
    assert meta["audio_base_name"] == "audio"


def test_job_manager_default_extension(tmp_path: Path):
    manager = JobManager(str(tmp_path))
    job_id = manager.create_job("audio")
    meta = json.loads((manager.get_job_dir(job_id) / "job_meta.json").read_text())
    assert meta["audio_ext"] == ".m4a"
