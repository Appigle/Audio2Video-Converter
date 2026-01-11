# Audio2Video Implementation Plan

## Overview
This document outlines the implementation plan for building a local audio-to-video conversion system with transcription capabilities.

## Project Structure
```
repo-root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── models.py             # Pydantic models for requests/responses
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── transcription.py  # faster-whisper integration
│   │   │   ├── video_processor.py # FFmpeg video generation
│   │   │   └── file_handler.py   # File upload & validation
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes.py         # API endpoints
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── job_manager.py    # Job ID generation & directory management
│   │       └── vtt_generator.py  # VTT file generation from segments
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md                 # Backend-specific setup
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadForm.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── TranscriptPanel.tsx
│   │   ├── types/
│   │   │   └── api.ts            # TypeScript types for API responses
│   │   ├── services/
│   │   │   └── api.ts            # API client functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── .env.example
│   ├── vite.config.ts            # Vite config with CORS proxy if needed
│   └── tsconfig.json
├── data/
│   └── jobs/                      # Created at runtime
├── README.md                      # Main project README
└── IMPLEMENTATION_PLAN.md        # This file
```

## Implementation Phases

### Phase 1: Project Setup & Backend Foundation
**Goal**: Set up project structure and basic FastAPI backend

#### Tasks:
1. **Create directory structure**
   - Create `backend/`, `frontend/`, `data/jobs/` directories
   - Initialize Python package structure
   - Initialize frontend project (Vite + React + TypeScript)

2. **Backend dependencies**
   - Create `backend/requirements.txt` with:
     - fastapi
     - uvicorn
     - python-multipart
     - faster-whisper
     - pydantic
   - Create `backend/.env.example` for configuration

3. **Basic FastAPI app**
   - Create `backend/app/main.py` with FastAPI instance
   - Configure CORS for local development
   - Add health check endpoint
   - Set up logging

4. **Job management utilities**
   - Implement `job_manager.py`:
     - Generate unique job IDs (UUID)
     - Create job directories
     - Path utilities for job artifacts

### Phase 2: File Upload & Validation
**Goal**: Implement secure file upload with size validation

#### Tasks:
1. **File handler service**
   - Implement `file_handler.py`:
     - Stream-based file upload with 100MB hard limit
     - Validate file type (.m4a for audio, .jpg/.png for image)
     - Save uploaded files to job directory
     - Handle optional background image

2. **API endpoint for upload**
   - Create POST `/convert` endpoint:
     - Accept multipart/form-data
     - Required: audio file (.m4a)
     - Optional: background image
     - Return job_id immediately (async processing)
     - Validate file size during stream

3. **Error handling**
   - File size exceeded errors
   - Invalid file type errors
   - Storage errors

### Phase 3: Transcription Service
**Goal**: Implement local transcription using faster-whisper

#### Tasks:
1. **Whisper model singleton**
   - Implement `transcription.py`:
     - Load Whisper model once at startup (singleton pattern)
     - Support model path configuration (local or download)
     - Use base or small model for faster processing
     - Handle model loading errors gracefully

2. **Transcription logic**
   - Transcribe audio file from job directory
   - Extract segments with timestamps
   - Format segments as: `[{ id, start, end, text }]`
   - Handle transcription errors with clear messages

3. **Transcript output**
   - Generate `transcript.json`:
     - Include version field "1.0"
     - Include segments array with timestamps
   - Generate `transcript.vtt`:
     - Convert segments to VTT format
     - Use HH:MM:SS.mmm timestamp format
     - Ensure timestamps match JSON exactly

4. **VTT generator utility**
   - Implement `vtt_generator.py`:
     - Convert segment timestamps to VTT format
     - Format text with proper line breaks
     - Write VTT file to job directory

### Phase 4: Video Processing
**Goal**: Generate MP4 video from audio + background image

#### Tasks:
1. **FFmpeg integration**
   - Implement `video_processor.py`:
     - Check FFmpeg availability
     - Build FFmpeg command with required parameters:
       - H.264 video codec
       - AAC audio codec
       - yuv420p pixel format
       - 1280x720 resolution (scale/pad)
       - Audio loudness normalization (loudnorm)
       - -shortest flag
     - Execute with timeout (e.g., 10 minutes)
     - Capture and parse FFmpeg errors

2. **Video generation logic**
   - Use background image (or default if not provided)
   - Combine audio + image into MP4
   - Save to `output.mp4` in job directory
   - Handle FFmpeg execution failures

3. **Error handling**
   - FFmpeg not found errors
   - FFmpeg execution timeout
   - FFmpeg encoding errors
   - Return readable error messages

### Phase 5: API Endpoints & Response Handling
**Goal**: Complete backend API with all endpoints

#### Tasks:
1. **Convert endpoint completion**
   - Process upload → transcription → video generation
   - Return response with:
     - job_id
     - video_url (GET endpoint path)
     - transcript_json_url
     - transcript_vtt_url
     - processing: "local-only"

2. **File serving endpoints**
   - GET `/jobs/{job_id}/video` → serve output.mp4
   - GET `/jobs/{job_id}/transcript.json` → serve transcript.json
   - GET `/jobs/{job_id}/transcript.vtt` → serve transcript.vtt
   - Proper content-type headers
   - Handle missing files (404)

3. **Response models**
   - Create Pydantic models in `models.py`:
     - ConvertRequest (for validation)
     - ConvertResponse
     - ErrorResponse

### Phase 6: Frontend Setup & UI Components
**Goal**: Build React frontend with TypeScript

#### Tasks:
1. **Frontend project setup**
   - Initialize Vite + React + TypeScript project
   - Install dependencies:
     - react, react-dom
     - typescript
     - axios or fetch for API calls
   - Configure TypeScript
   - Create `.env.example` with `VITE_API_BASE_URL`

2. **Type definitions**
   - Create `types/api.ts`:
     - ConvertResponse interface
     - TranscriptSegment interface
     - ErrorResponse interface

3. **API client**
   - Implement `services/api.ts`:
     - uploadAudio() function
     - getJobStatus() function (if needed)
     - Error handling for API calls

4. **Upload form component**
   - Create `UploadForm.tsx`:
     - File input for .m4a
     - Optional image input
     - Submit button
     - Loading state
     - Error display
     - Form validation

### Phase 7: Video Player & Transcript Integration
**Goal**: Implement video player with subtitle and transcript sync

#### Tasks:
1. **Video player component**
   - Create `VideoPlayer.tsx`:
     - HTML5 video element
     - Load video from API
     - Attach VTT track via `<track>` element
     - Track current playback time
     - Expose seek function

2. **Transcript panel component**
   - Create `TranscriptPanel.tsx`:
     - Load transcript.json
     - Display segments with timestamps
     - Highlight active segment based on video time
     - Click-to-seek functionality
     - Auto-scroll to keep active line visible
     - Format timestamps nicely

3. **Time synchronization**
   - Use video `timeupdate` event
   - Match current time to transcript segments
   - Update highlight state
   - Smooth scrolling behavior

4. **Main app component**
   - Create `App.tsx`:
     - Layout with upload form
     - Results section (conditional)
     - Video player + transcript panel side-by-side
     - Job ID display
     - Error handling

### Phase 8: Styling & UX Polish
**Goal**: Make UI functional and visually clean

#### Tasks:
1. **Basic styling**
   - Add CSS or styled-components
   - Responsive layout
   - Loading states
   - Error states
   - Highlight active transcript segment
   - Hover states for clickable segments

2. **User experience**
   - Clear error messages
   - Progress indicators during processing
   - Disable form during processing
   - Success feedback

### Phase 9: Documentation & Testing
**Goal**: Complete documentation and verify end-to-end

#### Tasks:
1. **Main README**
   - Prerequisites section (Python 3.9+, Node.js, FFmpeg)
   - Installation steps for backend
   - Installation steps for frontend
   - Running instructions
   - Testing instructions
   - Example curl request
   - Troubleshooting section

2. **Backend README** (if needed)
   - Model download instructions
   - FFmpeg installation
   - Environment variables

3. **Definition of Done checklist**
   - Upload .m4a < 100MB ✓
   - Receive job_id and URLs ✓
   - Video plays in UI ✓
   - Subtitles show from VTT ✓
   - Transcript panel highlights + click-to-seek works ✓

4. **Environment files**
   - Complete `.env.example` files
   - Document all required variables

5. **Testing**
   - Test with sample .m4a file
   - Test with background image
   - Test without background image
   - Test file size limit enforcement
   - Test error cases
   - Verify all outputs are generated correctly

## Technical Decisions

### Backend
- **Model size**: Use `base` or `small` Whisper model for balance between speed and accuracy
- **Async processing**: Process transcription and video generation synchronously in the endpoint (simple for local dev)
- **Job storage**: Use UUID for job IDs, store in `data/jobs/<uuid>/`
- **File validation**: Stream-based validation with hard 100MB cap
- **FFmpeg timeout**: 10 minutes default (configurable)

### Frontend
- **Framework**: Vite + React + TypeScript (simpler than Next.js for this use case)
- **State management**: React hooks (useState, useEffect) - no Redux needed
- **API calls**: Fetch API or axios
- **Video player**: Native HTML5 video with WebVTT track

### Error Handling
- All errors return JSON with clear messages
- FFmpeg errors captured and returned
- Transcription errors handled gracefully
- File validation errors returned immediately

## Dependencies Summary

### Backend (requirements.txt)
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
faster-whisper>=0.9.0
pydantic>=2.0.0
```

### Frontend (package.json)
```
react>=18.0.0
react-dom>=18.0.0
typescript>=5.0.0
vite>=5.0.0
@types/react>=18.0.0
@types/react-dom>=18.0.0
```

## Critical Implementation Notes

1. **Model Loading**: Load Whisper model once at application startup, not per request
2. **File Size**: Enforce 100MB limit during stream write, not just Content-Length header
3. **FFmpeg**: Must be installed system-wide, check availability at startup
4. **CORS**: Configure FastAPI CORS to allow frontend origin (localhost:5173)
5. **Timestamps**: Ensure JSON and VTT timestamps are identical
6. **Video Format**: Strict adherence to H.264/AAC/yuv420p/1280x720 requirements
7. **Audio Normalization**: Use FFmpeg loudnorm filter for audio normalization

## Success Criteria

- ✅ Backend runs on port 8000
- ✅ Frontend runs on port 5173 (Vite default)
- ✅ Can upload .m4a file and receive all outputs
- ✅ Video plays with subtitles
- ✅ Transcript panel syncs with video playback
- ✅ Click-to-seek works
- ✅ File size limit enforced
- ✅ All error cases handled gracefully
- ✅ Documentation complete and accurate

