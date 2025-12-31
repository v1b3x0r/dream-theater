import uvicorn
import logging
from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from rich.panel import Panel
from rich.console import Console

# --- CONFIG & APP IMPORTS ---
from .config import DREAM_BOX, THUMB_DIR, BASE_DIR
from .db import init_db
from .models import ai
from .routes import router
from .scanner import start_watcher

console = Console()

class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        return all(x not in msg for x in ["/api/scan/progress", "/api/stats", "/api/discovery", "/api/galaxy/all"])

logging.getLogger("uvicorn.access").addFilter(EndpointFilter())

@asynccontextmanager
async def lifespan(app: FastAPI):
    console.print(Panel.fit(
        f"[bold cyan]🎭 DREAM THEATER KERNEL v7.7.0[/bold cyan]\n[dim]Omni-Platform Intelligence: {ai.device.upper()}[/dim]",
        border_style="blue"
    ))
    ai.load()
    init_db()
    observer = start_watcher()
    yield
    observer.stop()
    observer.join()

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(router, prefix="/api")
app.mount("/thumbs", StaticFiles(directory=str(THUMB_DIR)), name="thumbs")
app.mount("/raw", StaticFiles(directory=str(DREAM_BOX)), name="raw")

frontend_dist = BASE_DIR / "system" / "frontend-app" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    console.print("[yellow]⚠️  Frontend dist not found. Operating in API mode.[/yellow]")

if __name__ == "__main__":
    # 0.0.0.0 allows access from other devices in the local network (iPad/Phone)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, log_level="warning")