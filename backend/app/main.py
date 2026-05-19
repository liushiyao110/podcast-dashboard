from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.auth import init_default_user
from app.models import User
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.api import dashboard, episodes, import_csv, auth, retention, audience, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="保持含人量 数据看板 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# init default admin user
with SessionLocal() as db:
    init_default_user(db)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(episodes.router, prefix="/api/episodes", tags=["episodes"])
app.include_router(retention.router, prefix="/api/episodes", tags=["retention"])
app.include_router(audience.router, prefix="/api/audience", tags=["audience"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(import_csv.router, prefix="/api/import", tags=["import"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
