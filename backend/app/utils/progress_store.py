"""Progress tracking store for job processing status.

Thread-safe in-memory store for tracking job progress.
For local development, this is sufficient. For production, consider persistence.
"""
import threading
from datetime import datetime
from typing import Dict, Optional, List
from enum import Enum


class JobState(str, Enum):
    """Job processing state."""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class JobStage(str, Enum):
    """Job processing stage."""
    SAVING = "saving"
    TRANSCRIBING = "transcribing"
    RENDERING = "rendering"
    PACKAGING = "packaging"
    DONE = "done"
    ERROR = "error"


class ProgressModel:
    """Progress model for a job."""
    
    def __init__(
        self,
        state: JobState = JobState.QUEUED,
        stage: JobStage = JobStage.SAVING,
        percent: int = 0,
        message: str = "",
        error: Optional[str] = None
    ):
        self.state = state
        self.stage = stage
        self.percent = percent
        self.message = message
        self.error = error
        self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "state": self.state.value,
            "stage": self.stage.value,
            "percent": self.percent,
            "message": self.message,
            "updated_at": self.updated_at.isoformat(),
            "error": self.error
        }
    
    def update(
        self,
        state: Optional[JobState] = None,
        stage: Optional[JobStage] = None,
        percent: Optional[int] = None,
        message: Optional[str] = None,
        error: Optional[str] = None
    ):
        """Update progress fields."""
        if state is not None:
            self.state = state
        if stage is not None:
            self.stage = stage
        if percent is not None:
            self.percent = max(0, min(100, percent))  # Clamp 0-100
        if message is not None:
            self.message = message
        if error is not None:
            self.error = error
        self.updated_at = datetime.utcnow()


class ProgressStore:
    """Thread-safe progress store."""
    
    def __init__(self):
        self._store: Dict[str, ProgressModel] = {}
        self._batch_mapping: Dict[str, List[str]] = {}  # batch_id -> [job_ids]
        self._lock = threading.Lock()
    
    def create_job(self, job_id: str, message: str = "Job queued") -> ProgressModel:
        """Create a new job progress entry."""
        with self._lock:
            progress = ProgressModel(
                state=JobState.QUEUED,
                stage=JobStage.SAVING,
                percent=0,
                message=message
            )
            self._store[job_id] = progress
            return progress
    
    def get(self, job_id: str) -> Optional[ProgressModel]:
        """Get progress for a job."""
        with self._lock:
            return self._store.get(job_id)
    
    def update(
        self,
        job_id: str,
        state: Optional[JobState] = None,
        stage: Optional[JobStage] = None,
        percent: Optional[int] = None,
        message: Optional[str] = None,
        error: Optional[str] = None
    ) -> bool:
        """Update progress for a job. Returns True if job exists."""
        with self._lock:
            progress = self._store.get(job_id)
            if progress is None:
                return False
            progress.update(state, stage, percent, message, error)
            return True
    
    def add_to_batch(self, batch_id: str, job_id: str):
        """Add a job to a batch."""
        with self._lock:
            if batch_id not in self._batch_mapping:
                self._batch_mapping[batch_id] = []
            if job_id not in self._batch_mapping[batch_id]:
                self._batch_mapping[batch_id].append(job_id)
    
    def get_batch_jobs(self, batch_id: str) -> List[str]:
        """Get all job IDs in a batch."""
        with self._lock:
            return self._batch_mapping.get(batch_id, []).copy()
    
    def job_exists(self, job_id: str) -> bool:
        """Check if a job exists in the store."""
        with self._lock:
            return job_id in self._store


# Global progress store instance
progress_store = ProgressStore()

