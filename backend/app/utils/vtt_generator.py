"""Utility for generating VTT subtitle files from transcript segments."""
from typing import List, Dict
from pathlib import Path


def format_timestamp(seconds: float) -> str:
    """
    Format seconds to VTT timestamp format (HH:MM:SS.mmm).
    
    Args:
        seconds: Time in seconds
        
    Returns:
        Formatted timestamp string
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def generate_vtt(segments: List[Dict], output_path: Path) -> None:
    """
    Generate a VTT file from transcript segments.
    
    Args:
        segments: List of segment dicts with 'start', 'end', and 'text' keys
        output_path: Path where VTT file should be written
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("WEBVTT\n\n")
        
        for i, segment in enumerate(segments, start=1):
            start_time = format_timestamp(segment['start'])
            end_time = format_timestamp(segment['end'])
            text = segment['text'].strip()
            
            # Escape special VTT characters
            text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            
            f.write(f"{i}\n")
            f.write(f"{start_time} --> {end_time}\n")
            f.write(f"{text}\n\n")

