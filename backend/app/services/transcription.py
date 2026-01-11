"""Transcription service using faster-whisper."""
import os
import logging
from pathlib import Path
from typing import List, Dict, Optional
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)

# Global model instance (singleton)
_model_instance: Optional[WhisperModel] = None


def get_model(model_name: str = "base", model_path: Optional[str] = None) -> WhisperModel:
    """
    Get or load the Whisper model (singleton pattern).
    
    Args:
        model_name: Name of the model to use (e.g., "base", "small")
        model_path: Optional path to local model directory
        
    Returns:
        WhisperModel instance
    """
    global _model_instance
    
    if _model_instance is None:
        try:
            if model_path and Path(model_path).exists():
                logger.info(f"Loading Whisper model from local path: {model_path}")
                _model_instance = WhisperModel(model_path, device="cpu", compute_type="int8")
            else:
                logger.info(f"Loading Whisper model: {model_name} (will download if needed)")
                _model_instance = WhisperModel(model_name, device="cpu", compute_type="int8")
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise RuntimeError(f"Failed to load Whisper model: {e}")
    
    return _model_instance


def transcribe_audio(audio_path: Path, model_name: str = "base", model_path: Optional[str] = None) -> List[Dict]:
    """
    Transcribe audio file and return segments with timestamps.
    
    Args:
        audio_path: Path to audio file
        model_name: Whisper model name
        model_path: Optional path to local model
        
    Returns:
        List of segment dicts with 'id', 'start', 'end', 'text' keys
        
    Raises:
        RuntimeError: If transcription fails
    """
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
    
    try:
        model = get_model(model_name, model_path)
        logger.info(f"Starting transcription of {audio_path}")
        
        segments, info = model.transcribe(
            str(audio_path),
            beam_size=5,
            language="en"  # Can be made configurable
        )
        
        logger.info(f"Detected language: {info.language} (probability: {info.language_probability:.2f})")
        
        result_segments = []
        for i, segment in enumerate(segments, start=1):
            result_segments.append({
                'id': i,
                'start': segment.start,
                'end': segment.end,
                'text': segment.text
            })
        
        logger.info(f"Transcription complete: {len(result_segments)} segments")
        return result_segments
        
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise RuntimeError(f"Transcription failed: {e}")

