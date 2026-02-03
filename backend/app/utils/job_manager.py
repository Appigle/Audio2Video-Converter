"""Job management utilities for creating and managing job directories."""
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


class JobManager:
    """Manages job directories and file paths with meaningful resource names."""

    def __init__(self, base_dir: str = "data/jobs"):
        """
        Initialize JobManager.
        
        Args:
            base_dir: Base directory for storing job artifacts
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self._meta_filename = "job_meta.json"

    def _generate_timestamp(self) -> str:
        now = datetime.now(timezone.utc)
        return now.strftime("%Y%m%d_%H%M%S_%f")

    def _sanitize_audio_base_name(self, filename: Optional[str], max_length: int = 60) -> str:
        if not filename:
            return "audio"
        base = Path(filename).stem.strip()
        base = re.sub(r"[^A-Za-z0-9_-]+", "_", base).strip("_-")
        if not base:
            base = "audio"
        if len(base) > max_length:
            base = base[:max_length].rstrip("_-")
            if not base:
                base = "audio"
        return base

    def _get_audio_extension(self, filename: Optional[str]) -> str:
        ext = Path(filename).suffix.lower() if filename else ""
        if not ext:
            return ".m4a"
        return ext if ext.startswith(".") else f".{ext}"

    def _meta_path(self, job_id: str) -> Path:
        return self.get_job_dir(job_id) / self._meta_filename

    def _load_job_meta(self, job_id: str) -> Optional[dict]:
        meta_path = self._meta_path(job_id)
        if not meta_path.exists():
            return None
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write_job_meta(self, job_dir: Path, meta: dict) -> None:
        meta_path = job_dir / self._meta_filename
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=True)

    def create_job(self, audio_filename: Optional[str] = None) -> str:
        """
        Create a new job directory and return job ID.
        
        Returns:
            Job ID (timestamped string)
        """
        while True:
            timestamp = self._generate_timestamp()
            job_id = f"job_{timestamp}"
            job_dir = self.base_dir / job_id
            if not job_dir.exists():
                job_dir.mkdir(parents=True, exist_ok=True)
                break

        audio_base = self._sanitize_audio_base_name(audio_filename)
        audio_ext = self._get_audio_extension(audio_filename)
        resource_base_name = f"{audio_base}_{timestamp}"
        meta = {
            "timestamp": timestamp,
            "audio_base_name": audio_base,
            "audio_ext": audio_ext,
            "resource_base_name": resource_base_name,
            "original_audio_filename": audio_filename or "",
        }
        self._write_job_meta(job_dir, meta)
        return job_id

    def get_resource_base_name(self, job_id: str) -> str:
        meta = self._load_job_meta(job_id)
        if not meta:
            return job_id
        return meta.get("resource_base_name", job_id)

    def get_audio_extension(self, job_id: str) -> str:
        meta = self._load_job_meta(job_id)
        if not meta:
            return ".m4a"
        return meta.get("audio_ext", ".m4a")

    def get_job_dir(self, job_id: str) -> Path:
        """
        Get the directory path for a job.
        
        Args:
            job_id: Job identifier
            
        Returns:
            Path to job directory
        """
        return self.base_dir / job_id

    def get_source_audio_path(self, job_id: str) -> Path:
        """
        Get path to source audio file.
        
        Returns: Path to input audio file
        """
        meta = self._load_job_meta(job_id)
        if not meta:
            return self.get_job_dir(job_id) / "source_audio.m4a"
        return self.get_job_dir(job_id) / f"{meta['resource_base_name']}{meta['audio_ext']}"

    def get_background_image_path(self, job_id: str) -> Path:
        """
        Get path to background image file.
        
        Returns: Path to background_image.jpg
        """
        return self.get_job_dir(job_id) / "background_image.jpg"

    def get_rendered_video_path(self, job_id: str) -> Path:
        """
        Get path to rendered video file.
        
        Returns: Path to rendered_video.mp4
        """
        meta = self._load_job_meta(job_id)
        if not meta:
            return self.get_job_dir(job_id) / "rendered_video.mp4"
        return self.get_job_dir(job_id) / f"{meta['resource_base_name']}.mp4"

    def get_transcript_segments_path(self, job_id: str) -> Path:
        """
        Get path to transcript segments JSON file.
        
        Returns: Path to transcript_segments.json
        """
        meta = self._load_job_meta(job_id)
        if not meta:
            return self.get_job_dir(job_id) / "transcript_segments.json"
        return self.get_job_dir(job_id) / f"{meta['resource_base_name']}.json"

    def get_subtitles_path(self, job_id: str) -> Path:
        """
        Get path to subtitles VTT file.
        
        Returns: Path to subtitles.vtt
        """
        meta = self._load_job_meta(job_id)
        if not meta:
            return self.get_job_dir(job_id) / "subtitles.vtt"
        return self.get_job_dir(job_id) / f"{meta['resource_base_name']}.vtt"

    def job_exists(self, job_id: str) -> bool:
        """Check if a job directory exists."""
        return self.get_job_dir(job_id).exists()

    # Legacy method aliases for backward compatibility (deprecated)
    def get_audio_path(self, job_id: str) -> Path:
        """Deprecated: Use get_source_audio_path() instead."""
        return self.get_source_audio_path(job_id)
    
    def get_image_path(self, job_id: str) -> Path:
        """Deprecated: Use get_background_image_path() instead."""
        return self.get_background_image_path(job_id)
    
    def get_video_path(self, job_id: str) -> Path:
        """Deprecated: Use get_rendered_video_path() instead."""
        return self.get_rendered_video_path(job_id)
    
    def get_transcript_json_path(self, job_id: str) -> Path:
        """Deprecated: Use get_transcript_segments_path() instead."""
        return self.get_transcript_segments_path(job_id)
    
    def get_transcript_vtt_path(self, job_id: str) -> Path:
        """Deprecated: Use get_subtitles_path() instead."""
        return self.get_subtitles_path(job_id)
