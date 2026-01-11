import { useState, useRef } from 'react';
import { uploadAudio, batchConvert } from '../services/api';
import type { ConvertResponse, BatchConvertResponse } from '../types/api';
import './UploadForm.css';

interface UploadFormProps {
  onSuccess: (response: ConvertResponse) => void;
  onBatchSuccess?: (response: BatchConvertResponse) => void;
  onError: (error: string) => void;
}

export function UploadForm({ onSuccess, onBatchSuccess, onError }: UploadFormProps) {
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        onError(`${file.name}: File must be less than 100MB`);
        continue;
      }
      if (!file.name.toLowerCase().endsWith('.m4a')) {
        onError(`${file.name}: File must be in .m4a format`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setAudioFiles(validFiles);
      setIsBatchMode(validFiles.length > 1);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (!['jpg', 'jpeg', 'png'].includes(ext || '')) {
        onError('Image must be .jpg or .png format');
        return;
      }
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (audioFiles.length === 0) {
      onError('Please select at least one audio file');
      return;
    }

    setIsUploading(true);
    try {
      if (isBatchMode && audioFiles.length > 1) {
        // Batch mode
        if (onBatchSuccess) {
          const response = await batchConvert(audioFiles, imageFile || undefined);
          onBatchSuccess(response);
        } else {
          onError('Batch mode not supported');
        }
      } else {
        // Single file mode
        const response = await uploadAudio(audioFiles[0], imageFile || undefined);
        onSuccess(response);
      }
      
      // Reset form
      setAudioFiles([]);
      setImageFile(null);
      setIsBatchMode(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch (err) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError('Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div className="form-group">
        <label htmlFor="audio">
          Audio File{isBatchMode ? 's' : ''} (.m4a, max 100MB each) *
          {isBatchMode && <span className="batch-hint"> - Multiple files selected</span>}
        </label>
        <input
          ref={audioInputRef}
          id="audio"
          type="file"
          accept=".m4a"
          onChange={handleAudioChange}
          disabled={isUploading}
          multiple
          required
        />
        {audioFiles.length > 0 && (
          <div className="file-list">
            {audioFiles.map((file, idx) => (
              <span key={idx} className="file-info">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="image">Background Image (.jpg, .png) - Optional</label>
        <input
          ref={imageInputRef}
          id="image"
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleImageChange}
          disabled={isUploading}
        />
        {imageFile && (
          <span className="file-info">
            Selected: {imageFile.name}
          </span>
        )}
      </div>

      <button type="submit" disabled={isUploading || audioFiles.length === 0} className="submit-button">
        {isUploading ? 'Processing...' : isBatchMode ? `Convert ${audioFiles.length} Files` : 'Convert to Video'}
      </button>
    </form>
  );
}

