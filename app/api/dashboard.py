from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import get_current_user
from app.models import Episode, Audience
from app.schemas import DashboardStats, TrendsOut, TrendPoint

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total_plays = db.query(func.sum(Episode.play_count)).scalar() or 0
    avg_completion = db.query(func.avg(Episode.completion_rate)).scalar() or 0.0
    latest = db.query(Episode).order_by(Episode.publish_date.desc()).first()
    days_since = 0
    if latest and latest.publish_date:
        from datetime import datetime
        try:
            pd = datetime.strptime(latest.publish_date, "%Y-%m-%d")
            days_since = (datetime.now() - pd).days
        except:
            days_since = 0
    return DashboardStats(
        total_subscribers=0,  # placeholder until data source
        total_plays=int(total_plays),
        avg_completion_rate=round(float(avg_completion), 2),
        days_since_last_publish=days_since
    )

@router.get("/trends", response_model=TrendsOut)
def get_trends(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    episodes = db.query(Episode).order_by(Episode.publish_date).all()
    play_trend = []
    for ep in episodes:
        play_trend.append(TrendPoint(date=ep.publish_date or "", value=ep.play_count or 0))
    return TrendsOut(subscriber_trend=[], play_trend=play_trend)
