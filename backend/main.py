import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.routers import metrics
from backend.workers.data_sync import fetch_and_cache_fiscal_data
from apscheduler.schedulers.background import BackgroundScheduler
from backend.routers import metrics, chat

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    fetch_and_cache_fiscal_data()

    scheduler = BackgroundScheduler()
    scheduler.add_job(fetch_and_cache_fiscal_data, "interval", hours=1)
    scheduler.start()

    yield
    scheduler.shutdown()

app = FastAPI(title="US Fiscal Dashboard API", lifespan=lifespan)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(metrics.router)
app.include_router(chat.router)

# Tell FastAPI to serve your CSS and JS files when requested
app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")
app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")

# Serve the frontend
@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
