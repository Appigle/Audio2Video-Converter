"""File upload and validation service."""
import os
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException


MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB in bytes
ALLOWED_AUDIO_TYPES = {'.m4a'}
ALLOWED_IMAGE_TYPES = {'.jpg', '.jpeg', '.png'}


class FileHandler:
    """Handles file uploads and validation."""
    
    @staticmethod
    def validate_audio_file(file: UploadFile) -> None:
        """
        Validate audio file type and size.
        
        Args:
            file: Uploaded file
            
        Raises:
            HTTPException: If file is invalid
        """
        if not file.filename:
            raise HTTPException(status_code=400, detail="Audio file is required")
        
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_AUDIO_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid audio file type. Allowed types: {', '.join(ALLOWED_AUDIO_TYPES)}"
            )
    
    @staticmethod
    def validate_image_file(file: Optional[UploadFile]) -> None:
        """
        Validate image file type if provided.
        
        Args:
            file: Optional uploaded file
            
        Raises:
            HTTPException: If file is invalid
        """
        if file and file.filename:
            ext = Path(file.filename).suffix.lower()
            if ext not in ALLOWED_IMAGE_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid image file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
                )
    
    @staticmethod
    async def save_audio_file(file: UploadFile, output_path: Path) -> int:
        """
        Save audio file with size validation during stream.
        
        Args:
            file: Uploaded file
            output_path: Path where file should be saved
            
        Returns:
            Size of saved file in bytes
            
        Raises:
            HTTPException: If file exceeds size limit
        """
        total_size = 0
        
        with open(output_path, 'wb') as f:
            while True:
                chunk = await file.read(8192)  # Read in 8KB chunks
                if not chunk:
                    break
                
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    # Clean up partial file
                    if output_path.exists():
                        output_path.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail=f"File size exceeds {MAX_FILE_SIZE / (1024*1024):.0f}MB limit"
                    )
                
                f.write(chunk)
        
        return total_size
    
    @staticmethod
    async def save_image_file(file: Optional[UploadFile], output_path: Path) -> bool:
        """
        Save image file if provided.
        
        Args:
            file: Optional uploaded file
            output_path: Path where file should be saved
            
        Returns:
            True if file was saved, False if no file provided
        """
        if not file or not file.filename:
            return False
        
        with open(output_path, 'wb') as f:
            while True:
                chunk = await file.read(8192)
                if not chunk:
                    break
                f.write(chunk)
        
        return True

