"""Background job processor for audio-to-video conversion."""
import json
import logging
import os
from pathlib import Path
from typing import Optional

from app.models import TranscriptData, TranscriptSegment
from app.services.transcription import transcribe_audio
from app.services.video_processor import generate_video
from app.utils.job_manager import JobManager
from app.utils.progress_store import progress_store, JobState, JobStage
from app.utils.vtt_generator import generate_vtt

logger = logging.getLogger(__name__)

# Configuration
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
WHISPER_MODEL_PATH = os.getenv("WHISPER_MODEL_PATH", "")
FFMPEG_TIMEOUT = int(os.getenv("FFMPEG_TIMEOUT", "600"))


def process_job(
    job_id: str,
    job_manager: JobManager,
    audio_path: Path,
    image_path: Optional[Path] = None
):
    """
    Process a single job: transcribe, generate video, create outputs.
    
    This function runs in a background thread and updates progress throughout.
    
    Args:
        job_id: Job identifier
        job_manager: JobManager instance
        audio_path: Path to source audio file
        image_path: Optional path to background image
    """
    if os.getenv("A2V_TEST_MODE") == "1":
        try:
            progress_store.update(
                job_id,
                state=JobState.RUNNING,
                stage=JobStage.SAVING,
                percent=5,
                message="Files saved, starting transcription..."
            )

            segments = [
                {"id": 1, "start": 0.0, "end": 1.2, "text": "Test transcript segment."}
            ]

            transcript_data = TranscriptData(
                version="1.0",
                segments=[TranscriptSegment(**seg) for seg in segments]
            )
            transcript_segments_path = job_manager.get_transcript_segments_path(job_id)
            with open(transcript_segments_path, 'w', encoding='utf-8') as f:
                json.dump(transcript_data.model_dump(), f, indent=2, ensure_ascii=False)

            subtitles_path = job_manager.get_subtitles_path(job_id)
            generate_vtt(segments, subtitles_path)

            video_path = job_manager.get_rendered_video_path(job_id)
            video_path.parent.mkdir(parents=True, exist_ok=True)
            video_path.write_bytes(b"test-video")

            progress_store.update(
                job_id,
                state=JobState.SUCCEEDED,
                stage=JobStage.DONE,
                percent=100,
                message="Processing complete"
            )
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Job {job_id} failed: {error_msg}", exc_info=True)
            progress_store.update(
                job_id,
                state=JobState.FAILED,
                stage=JobStage.ERROR,
                percent=0,
                message=f"Processing failed: {error_msg}",
                error=error_msg
            )
        return

    try:
        # Stage: Saving (0-10%)
        progress_store.update(
            job_id,
            state=JobState.RUNNING,
            stage=JobStage.SAVING,
            percent=5,
            message="Files saved, starting transcription..."
        )
        
        # Stage: Transcribing (10-50%)
        progress_store.update(
            job_id,
            stage=JobStage.TRANSCRIBING,
            percent=10,
            message="Transcribing audio..."
        )
        
        logger.info(f"Starting transcription for job {job_id}")
        segments = transcribe_audio(
            audio_path,
            model_name=WHISPER_MODEL,
            model_path=WHISPER_MODEL_PATH if WHISPER_MODEL_PATH else None
        )
        
        progress_store.update(
            job_id,
            stage=JobStage.TRANSCRIBING,
            percent=50,
            message=f"Transcription complete: {len(segments)} segments"
        )
        
        # Stage: Packaging (50-60%) - Generate transcript files
        progress_store.update(
            job_id,
            stage=JobStage.PACKAGING,
            percent=55,
            message="Generating transcript files..."
        )
        
        # Generate transcript JSON
        transcript_data = TranscriptData(
            version="1.0",
            segments=[TranscriptSegment(**seg) for seg in segments]
        )
        transcript_segments_path = job_manager.get_transcript_segments_path(job_id)
        with open(transcript_segments_path, 'w', encoding='utf-8') as f:
            json.dump(transcript_data.model_dump(), f, indent=2, ensure_ascii=False)
        logger.info(f"Generated transcript segments: {transcript_segments_path}")
        
        # Generate VTT file
        subtitles_path = job_manager.get_subtitles_path(job_id)
        generate_vtt(segments, subtitles_path)
        logger.info(f"Generated subtitles: {subtitles_path}")
        
        progress_store.update(
            job_id,
            percent=60,
            message="Transcript files generated"
        )
        
        # Stage: Rendering (60-95%)
        progress_store.update(
            job_id,
            stage=JobStage.RENDERING,
            percent=60,
            message="Rendering video..."
        )
        
        logger.info(f"Starting video generation for job {job_id}")
        video_path = job_manager.get_rendered_video_path(job_id)
        generate_video(
            audio_path,
            image_path,
            video_path,
            timeout=FFMPEG_TIMEOUT
        )
        logger.info(f"Generated rendered video: {video_path}")
        
        progress_store.update(
            job_id,
            percent=95,
            message="Video rendering complete"
        )
        
        # Stage: Done (100%)
        progress_store.update(
            job_id,
            state=JobState.SUCCEEDED,
            stage=JobStage.DONE,
            percent=100,
            message="Processing complete"
        )
        
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Job {job_id} failed: {error_msg}", exc_info=True)
        progress_store.update(
            job_id,
            state=JobState.FAILED,
            stage=JobStage.ERROR,
            percent=0,
            message=f"Processing failed: {error_msg}",
            error=error_msg
        )
