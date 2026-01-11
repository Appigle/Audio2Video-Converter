/** API client functions */
import type {
  ConvertResponse, ErrorResponse, TranscriptData,
  ProgressResponse, BatchConvertResponse, BatchStatusResponse
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Upload audio file and optional image for conversion
 */
export async function uploadAudio(
  audioFile: File,
  imageFile?: File
): Promise<ConvertResponse> {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`${API_BASE_URL}/api/convert`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new ApiError(
      response.status,
      errorData.error || 'Upload failed',
      errorData.detail
    );
  }

  return response.json();
}

/**
 * Fetch transcript JSON data
 */
export async function fetchTranscript(
  transcriptUrl: string
): Promise<TranscriptData> {
  const fullUrl = transcriptUrl.startsWith('http')
    ? transcriptUrl
    : `${API_BASE_URL}${transcriptUrl}`;

  const response = await fetch(fullUrl);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      'Failed to fetch transcript',
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get full URL for a resource
 */
export function getResourceUrl(url: string): string {
  if (url.startsWith('http')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}

/**
 * Get job status/progress
 */
export async function getJobStatus(jobId: string): Promise<ProgressResponse> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/status`);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      'Failed to fetch job status',
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Batch convert multiple audio files
 */
export async function batchConvert(
  audioFiles: File[],
  imageFile?: File
): Promise<BatchConvertResponse> {
  const formData = new FormData();
  
  audioFiles.forEach(file => {
    formData.append('audios', file);
  });
  
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`${API_BASE_URL}/api/batch/convert`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new ApiError(
      response.status,
      errorData.error || 'Batch upload failed',
      errorData.detail
    );
  }

  return response.json();
}

/**
 * Get batch status
 */
export async function getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/batch/${batchId}/status`);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      'Failed to fetch batch status',
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

