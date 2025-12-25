from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from .config import DREAM_BOX, THUMB_DIR, BASE_DIR
from .db import init_db
from .models import ai
from .routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n" + "="*50)
    print(" 🪐 DREAM OS - MODULAR CORE v3.0")
    print("="*50)
    ai.load()
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def add_cors_header(request, call_next):
    if request.method == "OPTIONS": response = Response()
    else: response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(router, prefix="/api")

# Static Mounts
app.mount("/thumbs", StaticFiles(directory=THUMB_DIR), name="thumbs")
app.mount("/raw", StaticFiles(directory=DREAM_BOX), name="raw")

# Mount Frontend (Only if built)
frontend_dist = BASE_DIR / "system" / "frontend-app" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    print("⚠️ Frontend dist not found. Running in API-only mode (Use Vite for UI).")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
