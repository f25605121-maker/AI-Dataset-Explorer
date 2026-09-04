import sys
from pathlib import Path

# Ensure both the workspace root and backend root are in python path
backend_dir = Path(__file__).resolve().parent.parent
workspace_dir = backend_dir.parent

if str(workspace_dir) not in sys.path:
    sys.path.insert(0, str(workspace_dir))
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
