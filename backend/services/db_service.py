import json
import os

CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "fiscal_cache.json")

def get_latest_snapshot():
    """Returns the cached fiscal snapshot from disk, or None if not yet synced."""
    try:
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"[db_service] Failed to read cache: {e}")
        return None
