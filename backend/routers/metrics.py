from fastapi import APIRouter, HTTPException, Query
from backend.services.db_service import get_latest_snapshot
import httpx

router = APIRouter(prefix="/api/v1/metrics", tags=["Metrics"])

GROWTH_RATE_URL = "https://www.us-debt-clock.com/api/gpt/growth-rate"
DEBT_SHARE_URL = "https://www.us-debt-clock.com/api/gpt/debt-share"
COMPARE_YEARS_URL = "https://www.us-debt-clock.com/api/gpt/compare-years"

@router.get("/current")
async def get_current_metrics():
    """Fetches the latest Supabase snapshot and combines it with live velocity."""
    data = get_latest_snapshot()
    if not data:
        raise HTTPException(status_code=503, detail="Fiscal data not yet available. Server is still syncing.")

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(GROWTH_RATE_URL, timeout=5.0)
            velocity = res.json().get("per_second", 532407)
    except Exception:
        velocity = 532407  # Stable fallback

    return {
        "status": "success",
        "velocity_per_second": velocity,
        "snapshot": data
    }

@router.get("/debt-share")
async def get_debt_share(people: int = Query(..., gte=1)):
    """Proxies and returns national debt splits among a set quantity of people."""
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(DEBT_SHARE_URL, params={"people": people}, timeout=5.0)
            res.raise_for_status()
            return res.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"External API connectivity fault: {e}")

@router.get("/compare-years")
async def get_compare_years(year1: int = Query(..., gte=2000), year2: int = Query(..., gte=2000)):
    """Provides historical delta variations between two target years."""
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(COMPARE_YEARS_URL, params={"year1": year1, "year2": year2}, timeout=5.0)
            res.raise_for_status()
            return res.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"External API connectivity fault: {e}")
