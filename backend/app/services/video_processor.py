"""Video processing service using FFmpeg."""
import subprocess
import shutil
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def check_ffmpeg() -> bool:
    """
    Check if FFmpeg is available in the system.
    
    Returns:
        True if FFmpeg is available, False otherwise
    """
    if os.getenv("A2V_TEST_MODE") == "1":
        return True
    return shutil.which("ffmpeg") is not None


def generate_video(
    audio_path: Path,
    image_path: Optional[Path],
    output_path: Path,
    timeout: int = 600,
    default_image_path: Optional[Path] = None
) -> None:
    """
    Generate MP4 video from audio and background image using FFmpeg.
    
    Args:
        audio_path: Path to input audio file
        image_path: Optional path to background image
        output_path: Path where output video should be saved
        timeout: Timeout in seconds for FFmpeg execution
        default_image_path: Optional path to default background image
        
    Raises:
        RuntimeError: If FFmpeg is not available or execution fails
    """
    if os.getenv("A2V_TEST_MODE") == "1":
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"test-video")
        return

    if not check_ffmpeg():
        raise RuntimeError("FFmpeg is not installed or not found in PATH")
    
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    # Determine which image to use
    bg_image = image_path if image_path and image_path.exists() else default_image_path
    
    if not bg_image or not bg_image.exists():
        # Create a simple colored background if no image is available
        logger.warning("No background image provided, will create solid color background")
        bg_image = None
    
    try:
        # Build FFmpeg command
        # Basic structure: ffmpeg -loop 1 -i image -i audio -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest -s 1280x720 output.mp4
        
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file
        ]
        
        if bg_image:
            # Use provided image
            cmd.extend([
                "-loop", "1",
                "-i", str(bg_image),
            ])
        else:
            # Create solid color background (black) - use long duration, -shortest will handle actual length
            cmd.extend([
                "-f", "lavfi",
                "-i", "color=c=black:s=1280x720:d=3600",
            ])
        
        cmd.extend([
            "-i", str(audio_path),
            "-c:v", "libx264",
            "-preset", "medium",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            "-shortest",
            "-movflags", "+faststart",
            str(output_path)
        ])
        
        logger.info(f"Running FFmpeg command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or "Unknown FFmpeg error"
            logger.error(f"FFmpeg failed: {error_msg}")
            raise RuntimeError(f"FFmpeg execution failed: {error_msg}")
        
        if not output_path.exists():
            raise RuntimeError("FFmpeg completed but output file was not created")
        
        logger.info(f"Video generated successfully: {output_path}")
        
    except subprocess.TimeoutExpired:
        logger.error(f"FFmpeg execution timed out after {timeout} seconds")
        raise RuntimeError(f"FFmpeg execution timed out after {timeout} seconds")
    except Exception as e:
        logger.error(f"Video generation failed: {e}")
        raise RuntimeError(f"Video generation failed: {e}")
