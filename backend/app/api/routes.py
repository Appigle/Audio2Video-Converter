"""API routes for the audio-to-video conversion service."""
import json
import logging
import os
import threading
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse

from app.models import (
    ConvertResponse, ErrorResponse, TranscriptData, TranscriptSegment,
    ProgressResponse, BatchConvertResponse, BatchStatusResponse, BatchJobItem, BatchJobStatus
)
from app.services.file_handler import FileHandler
from app.services.video_processor import check_ffmpeg
from app.services.background_processor import process_job
from app.utils.job_manager import JobManager
from app.utils.progress_store import progress_store

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize job manager
jobs_base_dir = os.getenv("JOBS_BASE_DIR", "data/jobs")
job_manager = JobManager(jobs_base_dir)

# Get configuration from environment
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
WHISPER_MODEL_PATH = os.getenv("WHISPER_MODEL_PATH", "")
FFMPEG_TIMEOUT = int(os.getenv("FFMPEG_TIMEOUT", "600"))


@router.post("/convert", response_model=ConvertResponse)
async def convert_audio_to_video(
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(..., description="Audio file (.m4a)"),
    image: UploadFile = File(None, description="Optional background image (.jpg, .png)")
):
    """
    Convert audio file to video with transcription.
    
    Processing runs in the background. Use GET /jobs/{job_id}/status to check progress.
    
    Args:
        audio: Audio file (.m4a format, < 100MB)
        image: Optional background image (.jpg or .png)
        
    Returns:
        ConvertResponse with job_id and URLs
    """
    try:
        # Validate files
        FileHandler.validate_audio_file(audio)
        FileHandler.validate_image_file(image)
        
        # Check FFmpeg availability
        if not check_ffmpeg():
            raise HTTPException(
                status_code=503,
                detail="FFmpeg is not available. Please install FFmpeg."
            )
        
        # Create job
        job_id = job_manager.create_job()
        logger.info(f"Created job {job_id}")
        
        # Initialize progress
        progress_store.create_job(job_id, message="Uploading files...")
        
        # Save uploaded files
        audio_path = job_manager.get_source_audio_path(job_id)
        await FileHandler.save_audio_file(audio, audio_path)
        logger.info(f"Saved source audio file: {audio_path}")
        
        image_path = None
        if image and image.filename:
            image_path = job_manager.get_background_image_path(job_id)
            await FileHandler.save_image_file(image, image_path)
            logger.info(f"Saved background image file: {image_path}")
        
        # Start background processing
        background_tasks.add_task(process_job, job_id, job_manager, audio_path, image_path)
        
        # Return response immediately
        return ConvertResponse(
            job_id=job_id,
            video_url=f"/api/jobs/{job_id}/video",
            transcript_json_url=f"/api/jobs/{job_id}/transcript/json",
            transcript_vtt_url=f"/api/jobs/{job_id}/transcript/vtt",
            processing="local-only"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Conversion setup failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Conversion setup failed: {str(e)}"
        )


@router.get("/jobs/{job_id}/video")
async def get_video(job_id: str):
    """Serve the rendered video file."""
    video_path = job_manager.get_rendered_video_path(job_id)
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=f"{job_id}_rendered_video.mp4"
    )


@router.get("/jobs/{job_id}/transcript/json")
async def get_transcript_json(job_id: str):
    """Serve the transcript segments JSON file."""
    transcript_path = job_manager.get_transcript_segments_path(job_id)
    
    if not transcript_path.exists():
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    return FileResponse(
        transcript_path,
        media_type="application/json",
        filename=f"{job_id}_transcript_segments.json"
    )


@router.get("/jobs/{job_id}/transcript/vtt")
async def get_transcript_vtt(job_id: str):
    """Serve the subtitles VTT file."""
    vtt_path = job_manager.get_subtitles_path(job_id)
    
    if not vtt_path.exists():
        raise HTTPException(status_code=404, detail="Subtitles not found")
    
    return FileResponse(
        vtt_path,
        media_type="text/vtt",
        filename=f"{job_id}_subtitles.vtt"
    )


@router.post("/batch/convert", response_model=BatchConvertResponse)
async def batch_convert_audio_to_video(
    background_tasks: BackgroundTasks,
    audios: List[UploadFile] = File(..., description="Audio files (.m4a)"),
    image: UploadFile = File(None, description="Optional shared background image (.jpg, .png)")
):
    """
    Convert multiple audio files to video with transcription.
    
    Each audio file is processed as an independent job. Processing runs in the background.
    Use GET /batch/{batch_id}/status to check progress for all jobs.
    
    Args:
        audios: List of audio files (.m4a format, < 100MB each)
        image: Optional shared background image (.jpg or .png) for all jobs
        
    Returns:
        BatchConvertResponse with batch_id and list of jobs
    """
    try:
        if not audios:
            raise HTTPException(status_code=400, detail="At least one audio file is required")
        
        # Check FFmpeg availability
        if not check_ffmpeg():
            raise HTTPException(
                status_code=503,
                detail="FFmpeg is not available. Please install FFmpeg."
            )
        
        # Generate batch ID
        batch_id = str(uuid.uuid4())
        logger.info(f"Created batch {batch_id} with {len(audios)} files")
        
        # Validate and process each audio file
        jobs = []
        image_path = None
        
        # Save shared image if provided
        if image and image.filename:
            FileHandler.validate_image_file(image)
            # Save to a temporary location, will be copied to each job
            temp_image_path = Path(f"/tmp/batch_{batch_id}_image.jpg")
            await FileHandler.save_image_file(image, temp_image_path)
            image_path = temp_image_path
        
        for audio_file in audios:
            try:
                # Validate audio file
                FileHandler.validate_audio_file(audio_file)
                
                # Create job
                job_id = job_manager.create_job()
                logger.info(f"Created job {job_id} in batch {batch_id}")
                
                # Initialize progress
                progress_store.create_job(job_id, message="Uploading file...")
                progress_store.add_to_batch(batch_id, job_id)
                
                # Save audio file
                audio_path = job_manager.get_source_audio_path(job_id)
                await FileHandler.save_audio_file(audio_file, audio_path)
                logger.info(f"Saved source audio file: {audio_path}")
                
                # Copy shared image to job directory if provided
                job_image_path = None
                if image_path and image_path.exists():
                    job_image_path = job_manager.get_background_image_path(job_id)
                    import shutil
                    shutil.copy2(image_path, job_image_path)
                    logger.info(f"Copied background image to job: {job_image_path}")
                
                # Start background processing
                background_tasks.add_task(process_job, job_id, job_manager, audio_path, job_image_path)
                
                # Add to response
                jobs.append(BatchJobItem(
                    job_id=job_id,
                    filename=audio_file.filename or "unknown.m4a",
                    status="queued",
                    rendered_video_url=f"/api/jobs/{job_id}/video",
                    subtitles_url=f"/api/jobs/{job_id}/transcript/vtt",
                    transcript_segments_url=f"/api/jobs/{job_id}/transcript/json"
                ))
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Failed to process audio file {audio_file.filename}: {e}", exc_info=True)
                # Continue with other files, but log the error
                # Could optionally add failed job to response
        
        # Clean up temporary image if used
        if image_path and image_path.exists():
            try:
                image_path.unlink()
            except:
                pass
        
        return BatchConvertResponse(
            batch_id=batch_id,
            jobs=jobs
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch conversion setup failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Batch conversion setup failed: {str(e)}"
        )


@router.get("/batch/{batch_id}/status", response_model=BatchStatusResponse)
async def get_batch_status(batch_id: str):
    """Get processing status for all jobs in a batch."""
    job_ids = progress_store.get_batch_jobs(batch_id)
    
    if not job_ids:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    jobs = []
    for job_id in job_ids:
        progress = progress_store.get(job_id)
        if progress:
            # Get filename from job directory or use job_id
            filename = job_id  # Could be improved by storing filename in progress
            jobs.append(BatchJobStatus(
                job_id=job_id,
                filename=filename,
                status=ProgressResponse(**progress.to_dict())
            ))
    
    return BatchStatusResponse(
        batch_id=batch_id,
        jobs=jobs
    )


@router.get("/jobs/{job_id}/status", response_model=ProgressResponse)
async def get_job_status(job_id: str):
    """Get processing status for a job."""
    progress = progress_store.get(job_id)
    
    if progress is None:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return ProgressResponse(**progress.to_dict())


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    ffmpeg_available = check_ffmpeg()
    return {
        "status": "healthy",
        "ffmpeg_available": ffmpeg_available
    }

