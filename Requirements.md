PROJECT GOAL
Build a local development project that:

1. Uploads a .m4a audio file (< 100MB)
2. Generates an .mp4 video from the audio (using a static background image)
3. Transcribes the audio locally using faster-whisper
4. Outputs transcript WITH timestamps
5. Displays outcomes in a frontend UI for testing:
   - Video preview
   - Subtitle overlay (VTT)
   - Transcript panel (JSON), time-synced highlighting, click-to-seek

HARD CONSTRAINTS

- Local environment only. No cloud. No hosted services.
- Transcription must be local-only (no external speech APIs).
- Backend must enforce file size limit: < 100MB.
- Use faster-whisper for transcription.
- Use FFmpeg for video rendering.
- Outputs must include:
  - output.mp4
  - transcript.json (timestamped)
  - transcript.vtt (subtitle track)
- The system must be runnable from a clean checkout with documented local setup.

TECH STACK (FIXED DEFAULTS)
Backend:

- Python 3.9+
- FastAPI
- faster-whisper
- FFmpeg (system dependency)

Frontend:

- Next.js + TypeScript (or Vite React + TypeScript if simpler)
- Minimal UI; no auth; no database
- Must run locally and call the backend locally

ARCHITECTURE REQUIREMENTS
Backend:

- Provide an API endpoint POST /convert for multipart upload (audio required, image optional).
- Save job artifacts to a job directory per request:
  data/jobs/<job_id>/{input.m4a,bg.jpg,output.mp4,transcript.json,transcript.vtt}
- Return a response containing:
  - job_id
  - video_url
  - transcript_json_url
  - transcript_vtt_url
  - processing: "local-only"
- Provide GET endpoints to serve output.mp4, transcript.json, transcript.vtt.

Frontend:

- Provide a simple test harness UI:
  1. Upload form:
     - file picker for .m4a
     - optional image picker
     - submit button
  2. Results section:
     - show job_id
     - video player that loads the output.mp4
     - attach transcript.vtt as subtitles via <track>
     - transcript panel sourced from transcript.json:
       - list segments with timestamps
       - highlight the segment matching current playback time
       - click transcript line to seek video
       - auto-scroll transcript panel to keep active line visible
  3. Error handling:
     - show backend error message for invalid type or >100MB file
  4. Local-only assumptions:
     - backend base URL configurable via env var in frontend (default http://localhost:8000)

TRANSCRIPT REQUIREMENTS

- Use segment-level timestamps at minimum:
  segments: [{ id, start, end, text }]
- JSON schema must include version field "1.0"
- Generate VTT from the same segments so timestamps match.
- Use HH:MM:SS.mmm timestamp format in VTT.

VIDEO REQUIREMENTS

- Use FFmpeg to create mp4:
  - H.264 video + AAC audio
  - yuv420p pixel format
  - -shortest so video ends with audio
  - scale/pad output to 1280x720 (16:9) for consistency
  - apply audio loudness normalization (loudnorm)

LOCAL DEVELOPMENT REQUIREMENTS

- Provide a README with:
  - prerequisites (Python, Node, FFmpeg)
  - install steps for backend and frontend
  - commands to run backend and frontend
  - how to test with the UI
  - example curl request to /convert
- Provide a .env.example for frontend (and backend if needed).
- Ensure CORS is configured so the frontend can call the backend locally.

QUALITY & SAFETY

- Enforce 100MB limit by streamed write with hard cap, not only Content-Length.
- Capture and report FFmpeg and transcription failures with readable error messages.
- Add timeouts for FFmpeg execution to avoid hangs.
- Load the Whisper model as a singleton (avoid reloading per request).
- Ensure no runtime external network calls are required:
  - either pre-download the model weights during setup,
  - or document the one-time local download clearly and provide an offline mode option by loading from a local model path.

PROJECT STRUCTURE (MANDATORY)
repo-root/
backend/...
frontend/...
data/jobs/...
README.md

DELIVERABLES (WHAT YOU MUST OUTPUT)

1. Full repository structure with all necessary files implemented.
2. Backend implementation that can run locally on port 8000.
3. Frontend implementation that can run locally on port 3000 (or 5173 for Vite).
4. README with exact steps to run and verify end-to-end.
5. A minimal “Definition of Done” checklist that can be verified locally:
   - upload .m4a <100MB
   - receive job_id and URLs
   - video plays in UI
   - subtitles show from VTT
   - transcript panel highlights + click-to-seek works

DO NOT

- Do not add authentication, user accounts, payments, or cloud services.
- Do not add distributed queues, GPUs as mandatory, or any external transcription APIs.
- Do not produce partial code; implement end-to-end.
- Do not include timeline estimates or team planning.

EXECUTION MODE
Proceed with reasonable defaults and implement everything without asking questions unless absolutely required.
