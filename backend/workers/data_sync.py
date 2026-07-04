import json
import os
import httpx
from datetime import datetime, timezone

CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "fiscal_cache.json")

CURRENT_DEBT_URL = "https://www.us-debt-clock.com/api/gpt/current-debt"
GROWTH_RATE_URL = "https://www.us-debt-clock.com/api/gpt/growth-rate"

_FALLBACK_TOTAL_DEBT = 36_814_209_653_421
_FALLBACK_ANNUAL_INTEREST = 952_000_000_000

def fetch_and_cache_fiscal_data():
    """Fetches fiscal data from external APIs and saves a snapshot to disk."""
    print(f"[{datetime.now()}] Starting fiscal data sync...")

    try:
        with httpx.Client() as client:
            debt_res = client.get(CURRENT_DEBT_URL, timeout=10.0)
            debt_res.raise_for_status()
            debt_data = debt_res.json()

            growth_res = client.get(GROWTH_RATE_URL, timeout=10.0)
            growth_res.raise_for_status()
            growth_data = growth_res.json()

        print(f"[DEBUG] debt API raw response: {debt_data}")
        print(f"[DEBUG] growth API raw response: {growth_data}")

        total_debt = int(debt_data.get("total_debt") or _FALLBACK_TOTAL_DEBT)
        annual_interest = float(debt_data.get("annual_interest") or _FALLBACK_ANNUAL_INTEREST)

        if total_debt == 0:
            raise ValueError("total_debt is zero — cannot compute interest rate.")

        snapshot = {
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "total_debt_raw": total_debt,
            "debt_per_citizen_raw": int(debt_data.get("debt_per_citizen") or 109_488),
            "debt_to_gdp_ratio_raw": float(debt_data.get("debt_to_gdp_ratio") or 124.3),
            "federal_budget_deficit_raw": int(growth_data.get("annual_increase") or 1_680_000_000_000),
            "federal_spending_raw": 6_000_000_000_000,
            "federal_revenue_raw": 4_300_000_000_000,
            "average_interest_rate_raw": round((annual_interest / total_debt) * 100, 4),
        }

        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        with open(CACHE_FILE, "w") as f:
            json.dump(snapshot, f, indent=2)

        print(f"[{datetime.now()}] Sync successful. Cache written to {CACHE_FILE}")

    except httpx.HTTPStatusError as e:
        print(f"[{datetime.now()}] External API error ({e.response.status_code}): {e}")
    except httpx.RequestError as e:
        print(f"[{datetime.now()}] Network error: {e}")
    except Exception as e:
        print(f"[{datetime.now()}] Sync failed: {type(e).__name__}: {e}")

if __name__ == "__main__":
    fetch_and_cache_fiscal_data()
