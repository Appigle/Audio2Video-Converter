#!/bin/bash
# Installation script for Audio2Video backend

set -e  # Exit on error

echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Check if Python version is 3.14 or newer
if python3 -c "import sys; exit(0 if sys.version_info >= (3, 14) else 1)"; then
    echo "Python 3.14+ detected. Using special installation steps..."
    echo ""
    
    # Step 1: Upgrade build tools
    echo "Step 1: Upgrading build tools..."
    pip install --upgrade pip setuptools wheel cython
    
    # Step 2: Install av separately
    echo "Step 2: Installing PyAV (av) separately..."
    pip install "av>=12.0.0" --no-build-isolation || {
        echo "Failed to install av. Trying alternative approach..."
        pip install "av==16.1.0" --no-build-isolation || {
            echo "PyAV installation failed. This is likely due to Python 3.14 compatibility."
            echo "Please use Python 3.11 or 3.12 instead, or wait for PyAV to support Python 3.14."
            exit 1
        }
    }
    
    # Step 3: Install base requirements
    echo "Step 3: Installing base requirements..."
    pip install -r requirements-base.txt
    
    # Step 4: Install faster-whisper without dependencies
    echo "Step 4: Installing faster-whisper (without dependencies)..."
    pip install faster-whisper --no-deps
    
    # Step 5: Install faster-whisper dependencies manually
    echo "Step 5: Installing faster-whisper dependencies..."
    pip install ctranslate2 huggingface-hub tokenizers
    
    echo ""
    echo "✓ Installation complete for Python 3.14+!"
    
else
    echo "Python 3.11/3.12 detected. Using standard installation..."
    echo ""
    
    # Standard installation for Python 3.11/3.12
    pip install --upgrade pip setuptools wheel
    pip install -r requirements-base.txt
    pip install faster-whisper>=1.2.1
    
    echo ""
    echo "✓ Installation complete!"
fi

echo ""
echo "Verifying installation..."
python3 -c "import faster_whisper; print('✓ faster-whisper OK')" || echo "✗ faster-whisper import failed"
python3 -c "import fastapi; print('✓ fastapi OK')" || echo "✗ fastapi import failed"
python3 -c "import av; print('✓ av OK')" || echo "✗ av import failed"
