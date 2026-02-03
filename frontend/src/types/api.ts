/** TypeScript types for API responses and requests */

export interface ConvertResponse {
  job_id: string;
  resource_base_name: string;
  video_url: string;
  transcript_json_url: string;
  transcript_vtt_url: string;
  processing: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptData {
  version: string;
  segments: TranscriptSegment[];
}

export interface ProgressResponse {
  state: 'queued' | 'running' | 'succeeded' | 'failed';
  stage: 'saving' | 'transcribing' | 'rendering' | 'packaging' | 'done' | 'error';
  percent: number;
  message: string;
  updated_at: string;
  error?: string;
}

export interface BatchJobItem {
  job_id: string;
  filename: string;
  resource_base_name: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  rendered_video_url?: string;
  subtitles_url?: string;
  transcript_segments_url?: string;
}

export interface BatchConvertResponse {
  batch_id: string;
  jobs: BatchJobItem[];
}

export interface BatchJobStatus {
  job_id: string;
  filename: string;
  resource_base_name: string;
  status: ProgressResponse;
}

export interface BatchStatusResponse {
  batch_id: string;
  jobs: BatchJobStatus[];
}

export interface HistoryEntry {
  id: string;
  jobId: string;
  resourceBaseName: string;
  videoUrl: string;
  transcriptJsonUrl: string;
  transcriptVttUrl: string;
  createdAt: number;
  source: 'single' | 'batch';
}

export interface HealthResponse {
  status: string;
  ffmpeg_available?: boolean;
}
