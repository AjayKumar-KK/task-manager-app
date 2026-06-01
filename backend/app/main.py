"""FastAPI entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import auth, tasks

# Create tables on startup (for SQLite dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Manager API",
    version="1.0.0",
    description="A small task manager backend with JWT auth and Todo/In Progress/Done stages.",
)

# -----------------------------
# CORS FIX (IMPORTANT PART)
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# HEALTH ROUTES
# -----------------------------
@app.get("/")
def root():
    return {"status": "ok", "service": "task-manager-api"}


@app.get("/health")
def health():
    return {"status": "ok"}

# -----------------------------
# ROUTERS
# -----------------------------
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])