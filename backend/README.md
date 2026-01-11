# Backend - Audio2Video API

FastAPI backend for audio-to-video conversion with transcription.

## Quick Start

1. **Python Version Compatibility**

   - Recommended: Python 3.11 or 3.12
   - Python 3.14+ is supported but requires special installation steps (see below)

2. Create and activate virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

**Recommended: Use the installation script (handles Python version automatically):**

```bash
./install.sh
```

**Manual installation:**

**For Python 3.11 or 3.12:**

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements-base.txt
pip install faster-whisper>=1.2.1
```

**For Python 3.14+:**

```bash
# Step 1: Upgrade build tools
pip install --upgrade pip setuptools wheel cython

# Step 2: Install av (PyAV) separately to avoid compilation issues
pip install "av>=12.0.0" --no-build-isolation

# Step 3: Install base requirements
pip install -r requirements-base.txt

# Step 4: Install faster-whisper without dependencies (avoids onnxruntime conflict)
pip install faster-whisper --no-deps

# Step 5: Install faster-whisper dependencies manually
pip install ctranslate2 huggingface-hub tokenizers
```

4. Run the server:

```bash
python -m app.main
```

Or with uvicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Troubleshooting

### PyAV Installation Issues (Python 3.14+)

If you're using Python 3.14 or newer and encounter Cython compilation errors:

**Option 1: Use Python 3.11 or 3.12 (Recommended)**

```bash
# Install Python 3.12 via Homebrew (macOS)
brew install python@3.12

# Create venv with specific Python version
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Option 2: Install av separately**

```bash
pip install --upgrade pip setuptools wheel cython
pip install "av>=12.0.0" --no-build-isolation
pip install -r requirements.txt
```

**Option 3: Use pre-built wheels**

```bash
pip install --only-binary=:all: -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and adjust settings:

- `WHISPER_MODEL`: Model size (base, small, medium, large)
- `WHISPER_MODEL_PATH`: Path to local model (optional)
- `FFMPEG_TIMEOUT`: Timeout in seconds (default: 600)
- `JOBS_BASE_DIR`: Job storage directory

## Whisper Model

The model will be downloaded automatically on first use. Supported models:

- `tiny` - Fastest, least accurate
- `base` - Balanced (default)
- `small` - Better accuracy
- `medium` - High accuracy
- `large` - Best accuracy, slowest

To use a pre-downloaded model, set `WHISPER_MODEL_PATH` to the model directory.

## API Documentation

Once running, visit:

- API docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc
