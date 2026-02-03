"""Pydantic models for API requests and responses."""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class ConvertResponse(BaseModel):
    """Response model for /convert endpoint."""
    job_id: str
    resource_base_name: str
    video_url: str
    transcript_json_url: str
    transcript_vtt_url: str
    processing: str = "local-only"


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None


class TranscriptSegment(BaseModel):
    """Transcript segment model."""
    id: int
    start: float
    end: float
    text: str


class TranscriptData(BaseModel):
    """Transcript data model."""
    version: str = "1.0"
    segments: List[TranscriptSegment]


class ProgressResponse(BaseModel):
    """Progress response model for job status."""
    state: str  # queued | running | succeeded | failed
    stage: str  # saving | transcribing | rendering | packaging | done | error
    percent: int  # 0-100
    message: str
    updated_at: str  # ISO format datetime
    error: Optional[str] = None


class BatchJobItem(BaseModel):
    """Single job item in a batch response."""
    job_id: str
    filename: str
    resource_base_name: str
    status: str  # queued | running | succeeded | failed
    rendered_video_url: Optional[str] = None
    subtitles_url: Optional[str] = None
    transcript_segments_url: Optional[str] = None


class BatchConvertResponse(BaseModel):
    """Response model for batch convert endpoint."""
    batch_id: str
    jobs: List[BatchJobItem]


class BatchJobStatus(BaseModel):
    """Job status in batch status response."""
    job_id: str
    filename: str
    resource_base_name: str
    status: ProgressResponse


class BatchStatusResponse(BaseModel):
    """Response model for batch status endpoint."""
    batch_id: str
    jobs: List[BatchJobStatus]
