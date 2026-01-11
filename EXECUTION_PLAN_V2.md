# Audio2Video V2 Implementation Plan

## Overview
This plan implements the v2 requirements: meaningful resource naming, batch processing, progress reporting, download APIs, and frontend UX improvements.

## Current State Analysis

### Backend Current State
- **File naming**: Generic names (`input.m4a`, `output.mp4`, `transcript.json`, `transcript.vtt`, `bg.jpg`)
- **API endpoints**: 
  - `POST /api/convert` - Single file processing (synchronous, blocks)
  - `GET /api/jobs/{job_id}/video` - Video download
  - `GET /api/jobs/{job_id}/transcript.json` - JSON download
  - `GET /api/jobs/{job_id}/transcript.vtt` - VTT download
- **Processing**: Synchronous, blocks HTTP request
- **Progress tracking**: None

### Frontend Current State
- Single file upload form
- Video player with VTT subtitles
- Transcript panel with basic highlighting
- No progress display
- No download buttons
- No batch upload support
- No auto-scroll control

---

## Implementation Phases

### Phase 1: Backend - Resource Naming Refactor (B1)
**Goal**: Replace generic file names with meaningful, self-describing names

#### Tasks:
1. **Update JobManager** (`backend/app/utils/job_manager.py`)
   - Rename methods to use new naming convention:
     - `get_audio_path()` → `get_source_audio_path()` → returns `source_audio.m4a`
     - `get_image_path()` → `get_background_image_path()` → returns `background_image.jpg`
     - `get_video_path()` → `get_rendered_video_path()` → returns `rendered_video.mp4`
     - `get_transcript_json_path()` → `get_transcript_segments_path()` → returns `transcript_segments.json`
     - `get_transcript_vtt_path()` → `get_subtitles_path()` → returns `subtitles.vtt`
   - Update all method implementations
   - Add comments documenting naming convention

2. **Update API Routes** (`backend/app/api/routes.py`)
   - Update all references to use new JobManager method names
   - Update response field names in ConvertResponse model:
     - `video_url` → `rendered_video_url` (or keep URL, update filename)
     - `transcript_json_url` → `transcript_segments_url`
     - `transcript_vtt_url` → `subtitles_url`
   - Update download endpoints to use meaningful filenames:
     - Video: `rendered_video.mp4` (or `{job_id}_rendered_video.mp4`)
     - JSON: `transcript_segments.json`
     - VTT: `subtitles.vtt`

3. **Update Models** (`backend/app/models.py`)
   - Update ConvertResponse field names (or keep URLs, update filenames in responses)
   - Add comments about naming convention

4. **Update Services**
   - Update `file_handler.py` to use new paths
   - Update `transcription.py` to use new paths
   - Update `video_processor.py` to use new paths

5. **Documentation**
   - Add naming convention section to README
   - Document the convention: `{purpose}_{type}.{ext}`

**Deliverables:**
- All files use meaningful names
- Naming convention documented
- Backward compatibility considered (migration path if needed)

---

### Phase 2: Backend - Background Processing & Progress Tracking (B3)
**Goal**: Implement background processing with progress reporting

#### Tasks:
1. **Create Progress Store** (`backend/app/utils/progress_store.py`)
   - In-memory thread-safe dictionary
   - Store progress by job_id
   - Progress model:
     ```python
     {
       "state": "queued" | "running" | "succeeded" | "failed",
       "stage": "saving" | "rendering" | "transcribing" | "packaging" | "done" | "error",
       "percent": 0-100,
       "message": str,
       "updated_at": datetime,
       "error": Optional[str]
     }
     ```
   - Thread-safe operations (use threading.Lock)

2. **Create Background Processor Service** (`backend/app/services/background_processor.py`)
   - Function to process single job asynchronously
   - Update progress at each stage:
     - saving: 0-10%
     - transcribing: 10-50%
     - rendering: 50-90%
     - packaging: 90-95%
     - done: 100%
   - Handle errors and update progress state to "failed"
   - Use FastAPI BackgroundTasks or threading.Thread

3. **Update Convert Endpoint** (`backend/app/api/routes.py`)
   - Change to async background processing
   - Return job_id immediately
   - Initialize progress as "queued"
   - Start background task
   - Return response quickly

4. **Create Status Endpoint** (`backend/app/api/routes.py`)
   - `GET /api/jobs/{job_id}/status`
   - Return progress payload
   - Return 404 if job doesn't exist

5. **Update Processing Functions**
   - Modify `transcription.py` to accept progress callback (optional)
   - Modify `video_processor.py` to accept progress callback (optional)
   - Update progress during long operations

**Deliverables:**
- Background processing working
- Progress tracking functional
- Status endpoint returns accurate progress
- Thread-safe progress updates

---

### Phase 3: Backend - Batch Processing (B2)
**Goal**: Support multiple file processing in one request

#### Tasks:
1. **Create Batch Models** (`backend/app/models.py`)
   - `BatchConvertRequest` (if needed)
   - `BatchConvertResponse`:
     ```python
     {
       "batch_id": str,
       "jobs": [
         {
           "job_id": str,
           "filename": str,
           "status": "queued" | "running" | "succeeded" | "failed",
           "rendered_video_url": str,
           "subtitles_url": str,
           "transcript_segments_url": str
         }
       ]
     }
     ```
   - `BatchStatusResponse`:
     ```python
     {
       "batch_id": str,
       "jobs": [
         {
           "job_id": str,
           "filename": str,
           "status": ProgressState,
           "progress": ProgressModel
         }
       ]
     }
     ```

2. **Create Batch Endpoint** (`backend/app/api/routes.py`)
   - `POST /api/batch/convert`
   - Accept: `audios: List[UploadFile]`, `image: Optional[UploadFile]` (shared)
   - Validate each audio file independently
   - Create job for each audio file
   - Generate batch_id (UUID)
   - Start background processing for each job
   - Return batch response immediately

3. **Create Batch Status Endpoint** (`backend/app/api/routes.py`)
   - `GET /api/batch/{batch_id}/status`
   - Look up all jobs in batch
   - Return per-job status list

4. **Update Progress Store**
   - Track batch_id → [job_ids] mapping
   - Support batch queries

5. **Update Background Processor**
   - Support batch processing
   - Track batch associations

**Deliverables:**
- Batch convert endpoint working
- Batch status endpoint working
- Each file processed independently
- Proper error handling per file

---

### Phase 4: Backend - Download APIs Refinement (B4)
**Goal**: Clean, consistent download routes with proper headers

#### Tasks:
1. **Update Download Endpoints** (`backend/app/api/routes.py`)
   - `GET /api/jobs/{job_id}/video` - Already exists, update filename
   - `GET /api/jobs/{job_id}/transcript/vtt` - Rename from `/transcript.vtt`
   - `GET /api/jobs/{job_id}/transcript/json` - Rename from `/transcript.json`
   
2. **Improve File Responses**
   - Set proper Content-Type headers
   - Set Content-Disposition with meaningful filenames
   - Include job_id in filename: `{job_id}_rendered_video.mp4`
   - Return 404 if job not complete or file missing
   - Check job status before allowing download

3. **Update Models**
   - Update URL field names in responses to match new routes

**Deliverables:**
- Clean, consistent download routes
- Proper headers and filenames
- 404 handling for incomplete/missing jobs

---

### Phase 5: Frontend - Progress Display (F1)
**Goal**: Show progress for single and batch jobs

#### Tasks:
1. **Create Progress Component** (`frontend/src/components/ProgressDisplay.tsx`)
   - Display stage, percent, message
   - Progress bar visualization
   - Status indicator (queued/running/succeeded/failed)
   - Error display

2. **Create Batch Progress Component** (`frontend/src/components/BatchProgressDisplay.tsx`)
   - Table/list of files with individual progress
   - Per-file status indicators
   - Overall batch progress summary

3. **Create Progress Hook** (`frontend/src/hooks/useProgress.ts`)
   - Poll status endpoint on interval (500-1000ms)
   - Stop polling when finished/failed
   - Return progress state

4. **Update API Service** (`frontend/src/services/api.ts`)
   - Add `getJobStatus(job_id)` function
   - Add `getBatchStatus(batch_id)` function
   - Add `batchConvert(audios, image?)` function

5. **Update Upload Form** (`frontend/src/components/UploadForm.tsx`)
   - Add batch upload option (multiple file selection)
   - Show progress during processing
   - Handle batch responses

6. **Update App Component** (`frontend/src/App.tsx`)
   - Integrate progress display
   - Handle batch vs single job flows

**Deliverables:**
- Progress display for single jobs
- Progress display for batch jobs
- Polling mechanism working
- UI updates during processing

---

### Phase 6: Frontend - Transcript UX Improvements (F2)
**Goal**: Enhanced transcript interaction with auto-scroll control

#### Tasks:
1. **Update TranscriptPanel Component** (`frontend/src/components/TranscriptPanel.tsx`)
   - Add auto-scroll state management
   - Detect manual scroll (disable auto-scroll)
   - Add "Resume Auto-Scroll" button (shown when auto-scroll OFF)
   - Add "Auto-scroll: ON/OFF" indicator
   - Implement click-to-seek (already exists, verify)
   - Improve auto-scroll behavior:
     - Default: auto-scroll ON
     - On manual scroll: disable auto-scroll
     - Resume button: re-enable and snap to current

2. **Update VideoPlayer Component** (`frontend/src/components/VideoPlayer.tsx`)
   - Ensure seek function works correctly
   - Continue playing after seek

3. **Add Transcript Controls Component** (`frontend/src/components/TranscriptControls.tsx`)
   - Auto-scroll toggle
   - Resume button
   - Status indicator

**Deliverables:**
- Click-to-seek working
- Auto-scroll with manual override
- Resume button functional
- Clear UI states

---

### Phase 7: Frontend - Download Support (F3)
**Goal**: Download buttons for all resources

#### Tasks:
1. **Create Download Component** (`frontend/src/components/DownloadButtons.tsx`)
   - Download video button
   - Download VTT button
   - Download JSON button
   - Use backend download APIs
   - Handle download errors

2. **Update API Service** (`frontend/src/services/api.ts`)
   - Add download helper functions (if needed)
   - Ensure proper URL construction

3. **Update Results Section** (`frontend/src/App.tsx`)
   - Add download buttons near results
   - Position appropriately in layout

**Deliverables:**
- Download buttons for all three resource types
- Proper filename handling
- Error handling

---

### Phase 8: Frontend - Fixed Player Layout (F4)
**Goal**: Sticky video player at top, transcript below

#### Tasks:
1. **Update App Layout** (`frontend/src/App.css`)
   - Make video player sticky/fixed at top
   - Limit player height to < 50% viewport
   - Position transcript panel below player
   - Ensure transcript remains scrollable
   - Responsive design for laptop screens

2. **Update VideoPlayer Component** (`frontend/src/components/VideoPlayer.tsx`)
   - Add max-height constraint
   - Ensure player doesn't cover controls

3. **Update Layout Structure** (`frontend/src/App.tsx`)
   - Reorganize layout: player → controls → transcript
   - Ensure proper spacing and scrolling

**Deliverables:**
- Fixed/sticky player at top
- Player < 50% screen height
- Transcript scrollable below
- Layout works on laptop screens

---

### Phase 9: Integration & Testing
**Goal**: End-to-end verification

#### Tasks:
1. **Update README**
   - Document new API endpoints
   - Document batch usage
   - Document progress polling
   - Document resource naming convention
   - Update examples

2. **Create Verification Checklist**
   - Upload multiple .m4a files (<100MB each)
   - UI shows each item progressing through stages
   - On completion, video plays, subtitles work, transcript highlights
   - Manual scroll disables autoscroll; resume button restores it
   - Download buttons fetch correct files via backend APIs
   - Fixed player layout works correctly

3. **Test All Features**
   - Single file upload with progress
   - Batch file upload with progress
   - Progress polling
   - Transcript interactions
   - Downloads
   - Layout responsiveness

**Deliverables:**
- Updated documentation
- Verification checklist
- All features tested and working

---

## Implementation Order

**Recommended sequence:**
1. Phase 1: Resource Naming (foundation)
2. Phase 2: Background Processing & Progress (core functionality)
3. Phase 4: Download APIs (quick win, uses Phase 1)
4. Phase 3: Batch Processing (builds on Phase 2)
5. Phase 5: Frontend Progress (needs Phase 2 & 3)
6. Phase 6: Transcript UX (independent)
7. Phase 7: Downloads (needs Phase 4)
8. Phase 8: Layout (independent)
9. Phase 9: Integration & Testing

---

## Technical Decisions

### Backend
- **Background Processing**: Use FastAPI `BackgroundTasks` for simplicity (local dev)
- **Progress Store**: In-memory dict with threading.Lock for thread safety
- **Batch ID**: UUID, stored in progress store mapping to job_ids
- **Progress Updates**: Update at major stage boundaries (not byte-perfect)

### Frontend
- **Polling Interval**: 750ms (middle of 500-1000ms range)
- **Auto-scroll Detection**: Track scroll events, compare scrollTop to detect manual scroll
- **Download**: Use `<a>` tags with `download` attribute or `fetch` + blob URL
- **Layout**: CSS `position: sticky` for player, flexbox for layout

### Naming Convention
- Format: `{purpose}_{type}.{ext}`
- Examples:
  - `source_audio.m4a`
  - `background_image.jpg`
  - `rendered_video.mp4`
  - `transcript_segments.json`
  - `subtitles.vtt`

---

## File Changes Summary

### Backend Files to Modify
- `backend/app/utils/job_manager.py` - Rename methods and file paths
- `backend/app/api/routes.py` - Add batch endpoints, status endpoints, update downloads
- `backend/app/models.py` - Add batch models, progress models
- `backend/app/services/file_handler.py` - Update path references
- `backend/app/services/transcription.py` - Update path references, add progress callback
- `backend/app/services/video_processor.py` - Update path references, add progress callback

### Backend Files to Create
- `backend/app/utils/progress_store.py` - Progress tracking store
- `backend/app/services/background_processor.py` - Background job processing

### Frontend Files to Modify
- `frontend/src/components/UploadForm.tsx` - Add batch support, progress display
- `frontend/src/components/VideoPlayer.tsx` - Layout constraints
- `frontend/src/components/TranscriptPanel.tsx` - Auto-scroll control
- `frontend/src/App.tsx` - Integrate all new features
- `frontend/src/App.css` - Fixed player layout
- `frontend/src/services/api.ts` - Add batch and status APIs
- `frontend/src/types/api.ts` - Add batch and progress types

### Frontend Files to Create
- `frontend/src/components/ProgressDisplay.tsx` - Progress UI
- `frontend/src/components/BatchProgressDisplay.tsx` - Batch progress UI
- `frontend/src/components/DownloadButtons.tsx` - Download controls
- `frontend/src/components/TranscriptControls.tsx` - Transcript controls
- `frontend/src/hooks/useProgress.ts` - Progress polling hook

---

## Risk Mitigation

1. **Backward Compatibility**: Keep old endpoints working during transition, or provide migration path
2. **Progress Accuracy**: Don't aim for byte-perfect, use stage-based percentages
3. **Concurrency**: Use thread-safe progress store, test with concurrent requests
4. **Error Handling**: Ensure failed jobs don't block batch processing
5. **Performance**: Background processing prevents request timeouts
6. **Frontend Polling**: Stop polling when done to reduce server load

---

## Success Criteria

- ✅ All files use meaningful names
- ✅ Batch processing works for multiple files
- ✅ Progress tracking accurate and accessible
- ✅ Download APIs return proper files with correct headers
- ✅ Frontend shows progress for single and batch jobs
- ✅ Transcript auto-scroll works with manual override
- ✅ Download buttons work for all resource types
- ✅ Fixed player layout works correctly
- ✅ All features documented
- ✅ Verification checklist complete

