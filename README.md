# Audio2Video Converter

A local development project that converts audio files (.m4a) to video files (.mp4) with automatic transcription using faster-whisper and FFmpeg.

## Features

- Upload single or multiple .m4a audio files (< 100MB each)
- Generate .mp4 video with static background image
- Local transcription using faster-whisper (no external APIs)
- Timestamped transcripts in JSON and VTT formats
- Real-time progress tracking for single and batch jobs
- Web UI with video player, subtitle overlay, and interactive transcript panel
- Click-to-seek functionality in transcript
- Auto-scroll transcript with manual override control
- Time-synced highlighting of transcript segments
- Download buttons for video, subtitles, and transcript files
- Fixed/sticky video player layout

## Prerequisites

- **Python 3.9+** - For the backend
- **Node.js 18+** - For the frontend
- **FFmpeg** - Must be installed system-wide

### Installing FFmpeg

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Windows:**
Download from [FFmpeg website](https://ffmpeg.org/download.html) and add to PATH.

Verify installation:

```bash
ffmpeg -version
```

## Project Structure

```
Audio2Video/
├── backend/          # FastAPI backend
├── frontend/         # React + TypeScript frontend
├── data/jobs/        # Job artifacts (created at runtime)
└── README.md         # This file
```

## Installation

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment (recommended):

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

**Recommended: Use the installation script:**

```bash
./install.sh
```

**Or install manually:**

For Python 3.11/3.12:

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements-base.txt
pip install faster-whisper>=1.2.1
```

For Python 3.14+:

```bash
pip install --upgrade pip setuptools wheel cython
pip install "av>=12.0.0" --no-build-isolation
pip install -r requirements-base.txt
pip install faster-whisper --no-deps
pip install ctranslate2 huggingface-hub tokenizers
```

4. (Optional) Configure environment variables:

```bash
cp .env.example .env
# Edit .env if needed
```

The Whisper model will be downloaded automatically on first use. To use a pre-downloaded model, set `WHISPER_MODEL_PATH` in `.env`.

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Configure API URL:

```bash
cp .env.example .env
# Edit .env if needed (default: http://localhost:8000)
```

## Running the Application

### Start the Backend

From the `backend` directory:

```bash
# With virtual environment activated
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will start on `http://localhost:8000`

### Start the Frontend

From the `frontend` directory:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

### Single File Conversion

1. Open your browser and navigate to `http://localhost:5173`
2. Click "Choose File" to select a .m4a audio file (must be < 100MB)
3. (Optional) Select a background image (.jpg or .png)
4. Click "Convert to Video"
5. Monitor progress in real-time as the job processes
6. View the results:
   - Fixed video player at top with subtitles
   - Interactive transcript panel below
   - Click any transcript segment to seek to that time
   - Use download buttons to save video, subtitles, or transcript

### Batch File Conversion

1. Select multiple .m4a files at once (each must be < 100MB)
2. (Optional) Select a shared background image for all files
3. Click "Convert X Files"
4. Monitor progress for each file in the batch
5. Each file is processed independently with its own job ID

### Transcript Features

- **Auto-scroll**: Transcript automatically scrolls to keep current segment visible
- **Manual scroll**: Manually scrolling disables auto-scroll
- **Resume auto-scroll**: Click "Resume Auto-Scroll" button to re-enable
- **Click-to-seek**: Click any transcript segment to jump to that time in the video

## API Endpoints

### POST /api/convert

Convert a single audio file to video with transcription. Processing runs in the background.

**Request:**

- `audio` (file, required): .m4a audio file (< 100MB)
- `image` (file, optional): Background image (.jpg, .png)

**Response:**

```json
{
  "job_id": "job_20240118_153045_123456",
  "resource_base_name": "meeting_20240118_153045_123456",
  "video_url": "/api/jobs/{job_id}/video",
  "transcript_json_url": "/api/jobs/{job_id}/transcript/json",
  "transcript_vtt_url": "/api/jobs/{job_id}/transcript/vtt",
  "processing": "local-only"
}
```

**Note:** Use `GET /api/jobs/{job_id}/status` to check processing progress.

### POST /api/batch/convert

Convert multiple audio files in a single request. Each file is processed as an independent job.

**Request:**

- `audios` (files[], required): Array of .m4a audio files (each < 100MB)
- `image` (file, optional): Shared background image (.jpg, .png) for all files

**Response:**

```json
{
  "batch_id": "uuid-string",
  "jobs": [
    {
      "job_id": "job_20240118_153045_123456",
      "filename": "meeting_20240118_153045_123456",
      "resource_base_name": "meeting_20240118_153045_123456",
      "status": "queued",
      "rendered_video_url": "/api/jobs/{job_id}/video",
      "subtitles_url": "/api/jobs/{job_id}/transcript/vtt",
      "transcript_segments_url": "/api/jobs/{job_id}/transcript/json"
    }
  ]
}
```

### GET /api/jobs/{job_id}/status

Get processing status and progress for a job.

**Response:**

```json
{
  "state": "queued" | "running" | "succeeded" | "failed",
  "stage": "saving" | "transcribing" | "rendering" | "packaging" | "done" | "error",
  "percent": 0-100,
  "message": "Processing...",
  "updated_at": "2024-01-01T12:00:00Z",
  "error": null
}
```

### GET /api/batch/{batch_id}/status

Get processing status for all jobs in a batch.

**Response:**

```json
{
  "batch_id": "uuid-string",
  "jobs": [
    {
      "job_id": "job_20240118_153045_123456",
      "filename": "meeting_20240118_153045_123456",
      "resource_base_name": "meeting_20240118_153045_123456",
      "status": {
        "state": "running",
        "stage": "transcribing",
        "percent": 35,
        "message": "Transcribing audio...",
        "updated_at": "2024-01-01T12:00:00Z",
        "error": null
      }
    }
  ]
}
```

### GET /api/jobs/{job_id}/video

Download the rendered video file.

**Response:** Video file (MP4) with filename: `{resource_base_name}.mp4`

### GET /api/jobs/{job_id}/transcript/json

Download the transcript segments JSON file.

**Response:** JSON file with filename: `{resource_base_name}.json`

### GET /api/jobs/{job_id}/transcript/vtt

Download the subtitles VTT file.

**Response:** VTT file with filename: `{resource_base_name}.vtt`

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "ffmpeg_available": true
}
```

## Example cURL Request

```bash
curl -X POST "http://localhost:8000/api/convert" \
  -F "audio=@sample.m4a" \
  -F "image=@background.jpg"
```

## Job IDs and Resource Naming

Job IDs include a UTC timestamp suffix to keep them sortable and unique:

- Format: `job_YYYYMMDD_HHMMSS_mmmuuu`
- Example: `job_20240118_153045_123456`

Generated resources derive from the original input audio base name (sanitized) plus the same timestamp:

- Pattern: `[input_audio_name]_[timestamp].[ext]`
- Example input: `meeting.m4a`
- Example outputs:
  - `meeting_20240118_153045_123456.mp4`
  - `meeting_20240118_153045_123456.vtt`
  - `meeting_20240118_153045_123456.json`

Input audio names are sanitized to remove spaces and unsafe characters, and truncated to a safe length.

### Transcript JSON Format

```json
{
  "version": "1.0",
  "segments": [
    {
      "id": 1,
      "start": 0.0,
      "end": 5.2,
      "text": "Hello, this is a sample transcript."
    }
  ]
}
```

## Configuration

### Backend Environment Variables

- `WHISPER_MODEL` - Whisper model to use (default: "base")
- `WHISPER_MODEL_PATH` - Path to local model directory (optional)
- `FFMPEG_TIMEOUT` - FFmpeg execution timeout in seconds (default: 600)
- `JOBS_BASE_DIR` - Base directory for job storage (default: "../data/jobs")
- `HOST` - Server host (default: "0.0.0.0")
- `PORT` - Server port (default: 8000)

### Frontend Environment Variables

- `VITE_API_BASE_URL` - Backend API URL (default: "http://localhost:8000")

## Troubleshooting

### FFmpeg not found

Ensure FFmpeg is installed and available in your PATH:

```bash
which ffmpeg  # Should return a path
ffmpeg -version
```

### Whisper model download issues

The model will be downloaded automatically on first use. If you have network issues:

1. Download the model manually
2. Set `WHISPER_MODEL_PATH` in `.env` to point to the model directory

### File size limit exceeded

The system enforces a 100MB limit on audio files. Ensure your file is under this limit.

### CORS errors

If you see CORS errors, ensure:

- Backend is running on port 8000
- Frontend is running on port 5173
- CORS is properly configured in `backend/app/main.py`

### Video generation fails

Check:

- FFmpeg is installed correctly
- Input audio file is valid
- Sufficient disk space available
- Check backend logs for detailed error messages

## Definition of Done Checklist

### Basic Functionality

- ✅ Upload .m4a file < 100MB
- ✅ Receive job_id and URLs
- ✅ Video plays in UI
- ✅ Subtitles show from VTT
- ✅ Transcript panel highlights active segment
- ✅ Click-to-seek works in transcript panel

### V2 Features

- ✅ Upload multiple .m4a files (<100MB each)
- ✅ UI shows each item progressing through stages
- ✅ On completion, video plays, subtitles work, transcript highlights current line
- ✅ Manual scroll disables autoscroll; resume button restores it
- ✅ Download buttons fetch correct files via backend APIs
- ✅ Fixed player layout works correctly
- ✅ Progress tracking shows accurate status
- ✅ Batch processing works independently per file

## Technical Details

### Video Specifications

- Codec: H.264 (libx264)
- Audio: AAC (192kbps)
- Resolution: 1280x720 (16:9)
- Pixel format: yuv420p
- Audio normalization: loudnorm filter applied

### Transcription

- Model: faster-whisper (base model by default)
- Language: English (can be configured)
- Format: Segment-level timestamps
- Output: JSON and VTT formats

## License

This is a local development project. No license specified.
