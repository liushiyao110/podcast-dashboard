from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 优先从环境变量读取 DATABASE_URL，否则 fallback 到 SQLite
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'data', 'dashboard.db')}"
)

# PostgreSQL 需要 check_same_thread=False 不适用
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()