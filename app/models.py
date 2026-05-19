from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.database import Base
from datetime import datetime

class Episode(Base):
    __tablename__ = "episodes"
    id = Column(Integer, primary_key=True, index=True)
    episode_number = Column(Integer, index=True)
    title = Column(String, index=True)
    publish_date = Column(String)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    bookmarks = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    avg_play_duration = Column(Float, default=0.0)
    play_count = Column(Integer, default=0)
    data_update_time = Column(String, default=lambda: datetime.now().isoformat())

class Retention(Base):
    __tablename__ = "retentions"
    id = Column(Integer, primary_key=True, index=True)
    episode_id = Column(Integer, index=True)
    retention_90_min = Column(Float)
    retention_80_min = Column(Float)
    retention_75_min = Column(Float)
    retention_50_min = Column(Float)
    retention_25_min = Column(Float)
    retention_10_min = Column(Float)
    full_retention_data = Column(JSON)

class Audience(Base):
    __tablename__ = "audiences"
    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(String, index=True)
    male_pct = Column(Float, default=0.0)
    female_pct = Column(Float, default=0.0)
    age_under_18 = Column(Float, default=0.0)
    age_18_22 = Column(Float, default=0.0)
    age_23_28 = Column(Float, default=0.0)
    age_29_35 = Column(Float, default=0.0)
    age_36_40 = Column(Float, default=0.0)
    age_over_40 = Column(Float, default=0.0)

class UpdateLog(Base):
    __tablename__ = "update_logs"
    id = Column(Integer, primary_key=True, index=True)
    update_time = Column(String, default=lambda: datetime.now().isoformat())
    update_type = Column(String)
    episodes_updated = Column(Integer, default=0)
    operator = Column(String)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="viewer")  # admin | viewer
