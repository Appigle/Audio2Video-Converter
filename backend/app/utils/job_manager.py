"""Job management utilities for creating and managing job directories.

Resource Naming Convention:
All job artifacts follow the pattern: {purpose}_{type}.{ext}
- source_audio.m4a - Original uploaded audio file
- background_image.jpg - Background image (if provided)
- rendered_video.mp4 - Generated video output
- transcript_segments.json - Timestamped transcript segments in JSON format
- subtitles.vtt - WebVTT subtitle file

This naming convention makes file purposes self-describing and consistent.
"""
import uuid
import os
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
    
    def create_job(self) -> str:
        """
        Create a new job directory and return job ID.
        
        Returns:
            Job ID (UUID string)
        """
        job_id = str(uuid.uuid4())
        job_dir = self.base_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        return job_id
    
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
        
        Returns: Path to source_audio.m4a
        """
        return self.get_job_dir(job_id) / "source_audio.m4a"
    
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
        return self.get_job_dir(job_id) / "rendered_video.mp4"
    
    def get_transcript_segments_path(self, job_id: str) -> Path:
        """
        Get path to transcript segments JSON file.
        
        Returns: Path to transcript_segments.json
        """
        return self.get_job_dir(job_id) / "transcript_segments.json"
    
    def get_subtitles_path(self, job_id: str) -> Path:
        """
        Get path to subtitles VTT file.
        
        Returns: Path to subtitles.vtt
        """
        return self.get_job_dir(job_id) / "subtitles.vtt"
    
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

