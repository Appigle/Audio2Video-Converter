SCOPE
This task is a refinement pass. Implement the updated backend and frontend capabilities:

- Meaningful resource naming
- Multiple file processing
- Backend progress reporting to frontend
- Download APIs for output video and transcript resources (VTT + JSON)
- Frontend UX improvements for progress, transcript interaction, downloads, and layout

NON-GOALS

- Do not introduce cloud services, external APIs, user auth, payments, or distributed infrastructure.
- Do not remove existing working features.
- Do not change the existing tech stack unless required.

ENVIRONMENT CONSTRAINTS

- Local environment only.
- Must run end-to-end locally.

========================================
BACKEND UPDATES (MANDATORY)
========================================

B1) Meaningful resource naming
Replace generic names (e.g., input/output/vtt) with meaningful, self-describing resource names across:

- Files on disk
- API response fields
- API routes (where reasonable)

Requirements:

- Job artifacts must have clear names reflecting content/type and purpose.
- Use a consistent naming convention and document it (README section + code comments).
- Example artifact naming (you may adapt, but must be meaningful and consistent):
  - source_audio.m4a
  - background_image.jpg
  - rendered_video.mp4
  - transcript_segments.json
  - subtitles.vtt

B2) Support multiple file processing
Support processing multiple audio files in one request AND/OR multiple concurrent jobs.

Minimum requirement (must implement):

- A new endpoint that accepts multiple audio files in a single request and returns a batch job result.
- Each file must be processed as an independent job with its own job_id and resources.
- Validate each file independently for type and size (< 100MB per file).
- Results must be addressable by job_id.

Deliverables:

- New API endpoint: POST /batch/convert (multipart: audios[], optional image per audio or shared image)
- Response must include a list of items, each with:
  - job_id
  - status (queued/running/succeeded/failed)
  - resource URLs for video + VTT + JSON

B3) Provide processing progress to the frontend
Implement progress reporting that is accurate enough for UI (not necessarily byte-perfect).
Progress must be available via API and updated during:

- Upload saved (optional)
- Video rendering (FFmpeg)
- Transcription (faster-whisper)
- Post-processing (VTT/JSON generation)
- Completion

Requirements:

- Provide a progress model with:
  - state: queued | running | succeeded | failed
  - stage: saving | rendering | transcribing | packaging | done | error
  - percent: 0–100
  - message: short human-readable text
  - updated_at timestamp
  - error (optional)

API requirements:

- GET /jobs/{job_id}/status returns the progress payload above.
- For batch: GET /batch/{batch_id}/status returns per-job status list (or an equivalent approach).

Implementation requirement:

- Use an internal progress store (in-memory dict is acceptable for local dev).
  If a lightweight persistence already exists, extend it; otherwise keep it simple and documented.
- Ensure concurrency safety (thread-safe updates if using background tasks).

Execution model requirement:

- Do not block the HTTP request for long processing. Convert endpoints must return quickly.
- Run processing in background tasks (FastAPI BackgroundTasks, thread pool, or a simple in-process queue).
- The frontend should poll the status endpoint(s).

B4) Download APIs for resources
Provide explicit APIs that allow downloading:

- output video
- transcript VTT
- transcript JSON

Requirements:

- Clean, consistent routes:
  - GET /jobs/{job_id}/video
  - GET /jobs/{job_id}/transcript/vtt
  - GET /jobs/{job_id}/transcript/json
- Set correct content types and file names on download.
- Return 404 if resource does not exist or job not complete.
- Ensure frontend can use these URLs directly for download.

========================================
FRONTEND UPDATES (MANDATORY)
========================================

F1) Add progress display
Implement UI that shows per-job progress for:

- single convert flow
- batch convert flow

Requirements:

- Display stage + percent + message.
- For batch: show a list/table of files with their own progress.
- Poll the backend status endpoint(s) on an interval (reasonable default: 500–1000ms) and stop polling when finished/failed.

F2) Transcript “play UX” improvements
Enhance the transcript viewing and playback interaction:

Requirements:

- Clicking a transcript sentence seeks the video to that sentence’s start timestamp and continues playing.
- Auto-highlight current sentence during playback.
- Auto-scroll behavior:
  - Default: auto-scroll transcript to keep current sentence visible.
  - If user manually scrolls the transcript panel, auto-scroll must STOP (do not snap back).
  - Provide a visible button “Resume Auto-Scroll” that re-enables auto-scroll and snaps to current sentence.
- Provide clear UI states:
  - “Auto-scroll: ON/OFF”
  - The resume button only shown when auto-scroll is OFF.

F3) Support downloading resources
Add UI controls to download:

- output video (.mp4)
- transcript (.vtt)
- transcript segments (.json)

Requirements:

- Buttons/links near the results section.
- Use backend download APIs (not direct filesystem paths).
- Name downloads meaningfully (use server-provided filename headers where possible).

F4) Layout: fixed video player at the top
Implement a layout improvement:

- Video player is fixed at the top of the viewport (sticky/fixed).
- The player area occupies less than half of the screen height.
- Below the player: transcript panel + controls (downloads, autoscroll toggle, progress, etc.)

UX Requirements:

- Ensure transcript panel remains scrollable independently.
- Ensure the fixed player does not cover important controls.
- Ensure the layout works on typical laptop screen sizes.

========================================
DELIVERABLES
========================================

D1) Updated backend implementation

- New/updated routes for batch convert, status, downloads
- Background processing + progress tracking
- Meaningful resource naming across system
- Updated README sections describing new API routes, batch usage, progress polling, resource naming convention

D2) Updated frontend implementation

- Batch upload UI
- Per-job progress display
- Transcript UX: click-to-seek, auto-scroll control with manual scroll disable + resume button
- Download buttons for mp4/vtt/json
- Fixed/sticky player layout (< 50% height)

D3) Verification checklist
Provide a short, machine-verifiable checklist:

- Upload multiple .m4a files (<100MB each)
- UI shows each item progressing through stages
- On completion, video plays, subtitles work, transcript highlights current line
- Manual scroll disables autoscroll; resume button restores it
- Download buttons fetch correct files via backend APIs

========================================
IMPLEMENTATION RULES
========================================

- Keep changes incremental; refactor only where needed to implement these requirements cleanly.
- Maintain existing code style and structure.
- Add minimal tests if the project already has tests; otherwise add at least basic smoke tests for new endpoints.
- Document all new endpoints and the progress payload schema in the README.
- Do not ask questions unless a blocking ambiguity exists; otherwise choose sensible defaults and proceed.
