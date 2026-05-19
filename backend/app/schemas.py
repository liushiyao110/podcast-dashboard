from pydantic import BaseModel
from typing import Optional, List

class EpisodeCreate(BaseModel):
    episode_number: int
    title: str
    publish_date: str
    likes: int = 0
    comments: int = 0
    bookmarks: int = 0
    shares: int = 0
    completion_rate: float = 0.0
    avg_play_duration: float = 0.0
    play_count: int = 0

class EpisodeOut(EpisodeCreate):
    id: int
    data_update_time: str
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_subscribers: int
    total_plays: int
    avg_completion_rate: float
    days_since_last_publish: int

class TrendPoint(BaseModel):
    date: str
    value: int

class TrendsOut(BaseModel):
    subscriber_trend: List[TrendPoint]
    play_trend: List[TrendPoint]

class AudienceOut(BaseModel):
    id: int
    record_date: str
    male_pct: float
    female_pct: float
    age_under_18: float
    age_18_22: float
    age_23_28: float
    age_29_35: float
    age_36_40: float
    age_over_40: float
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
