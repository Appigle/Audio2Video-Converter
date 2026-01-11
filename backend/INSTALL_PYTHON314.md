# Installation Guide for Python 3.14+

If you're using Python 3.14 or newer, follow these steps to install the backend dependencies:

## Quick Install (Python 3.14+)

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Step 1: Upgrade build tools
pip install --upgrade pip setuptools wheel cython

# Step 2: Install av (PyAV) separately - this avoids Cython compilation issues
pip install "av>=12.0.0" --no-build-isolation

# Step 3: Install faster-whisper and its core dependencies
pip install faster-whisper --no-deps
pip install ctranslate2 huggingface-hub tokenizers

# Step 4: Install remaining packages
pip install fastapi "uvicorn[standard]" python-multipart pydantic
```

## Why These Steps Are Needed

1. **PyAV (av package)**: Python 3.14 is very new, and older versions of PyAV don't have pre-built wheels. Installing `av>=12.0.0` separately ensures we get a version with Python 3.14 support.

2. **faster-whisper dependencies**: The package has complex dependency resolution. Installing it with `--no-deps` and then installing its dependencies separately avoids conflicts.

3. **ctranslate2 vs onnxruntime**: Newer versions of faster-whisper use `ctranslate2` which has better Python 3.14 support than `onnxruntime`.

## Verify Installation

Test that everything works:

```bash
python -c "import faster_whisper; print('✓ faster-whisper OK')"
python -c "import fastapi; print('✓ fastapi OK')"
python -c "import av; print('✓ av OK')"
```

## Alternative: Use Python 3.11 or 3.12

If you continue to have issues, consider using Python 3.11 or 3.12:

```bash
# Install Python 3.12 via Homebrew (macOS)
brew install python@3.12

# Create venv with specific version
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

