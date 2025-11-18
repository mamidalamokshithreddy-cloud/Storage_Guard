import uvicorn
from app import app
import logging
import os
from app.core.config import settings

# Set OpenMP environment variable before any PyTorch imports
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Debug PyTorch installation at startup
try:
    import torch
    print(f"[STARTUP] PyTorch version: {torch.__version__}")
    print(f"[STARTUP] CUDA available: {torch.cuda.is_available()}")
    print(f"[STARTUP] PyTorch path: {torch.__file__}")
    if torch.cuda.is_available():
        print(f"[STARTUP] GPU count: {torch.cuda.device_count()}")
        print(f"[STARTUP] GPU 0: {torch.cuda.get_device_name(0)}")
except ImportError as e:
    print(f"[STARTUP] Failed to import PyTorch: {e}")

logger = logging.getLogger(__name__)



if __name__ == "__main__":
    # Determine host/port dynamically from settings (.env), with safe defaults
    host = (settings.HOST or "0.0.0.0").strip()
    try:
        port = int(settings.PORT)
    except Exception:
        port = 8000

    print(f"[STARTUP] API binding -> host={host} port={port}")

    # Listen on all interfaces so Swagger UI in the browser can reach the API
    uvicorn.run(app, host=host, port=port, reload=True, access_log=True)
