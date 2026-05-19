from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
from app.models import Episode, Retention
from pydantic import BaseModel

class RetentionOut(BaseModel):
    episode_id: int
    retention_90_min: float
    retention_80_min: float
    retention_75_min: float
    retention_50_min: float
    retention_25_min: float
    retention_10_min: float
    full_retention_data: list
    class Config:
        from_attributes = True

router = APIRouter()

@router.get("/{ep_id}/retention", response_model=RetentionOut)
def get_retention(ep_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ep = db.query(Episode).filter(Episode.id == ep_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    ret = db.query(Retention).filter(Retention.episode_id == ep_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Retention data not found")
    return ret

@router.get("/{ep_id}/retention/compare")
def compare_retention(ep_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ep = db.query(Episode).filter(Episode.id == ep_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    current = db.query(Retention).filter(Retention.episode_id == ep_id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Retention data not found")
    
    prev = db.query(Episode).filter(Episode.episode_number < ep.episode_number).order_by(Episode.episode_number.desc()).first()
    prev_ret = None
    if prev:
        prev_ret = db.query(Retention).filter(Retention.episode_id == prev.id).first()
    
    avg_ret = db.query(Retention).all()
    avg_data = {}
    if avg_ret:
        import statistics
        avg_data = {
            "retention_90_min": round(statistics.mean([r.retention_90_min for r in avg_ret if r.retention_90_min]), 2) if any(r.retention_90_min for r in avg_ret) else 0,
            "retention_50_min": round(statistics.mean([r.retention_50_min for r in avg_ret if r.retention_50_min]), 2) if any(r.retention_50_min for r in avg_ret) else 0,
            "retention_10_min": round(statistics.mean([r.retention_10_min for r in avg_ret if r.retention_10_min]), 2) if any(r.retention_10_min for r in avg_ret) else 0,
        }
    
    return {
        "current": {
            "episode_number": ep.episode_number,
            "title": ep.title,
            "retention_50_min": current.retention_50_min,
        },
        "previous": {
            "episode_number": prev.episode_number if prev else None,
            "title": prev.title if prev else None,
            "retention_50_min": prev_ret.retention_50_min if prev_ret else None,
        } if prev else None,
        "average": avg_data,
        "diagnosis": generate_diagnosis(ep, current, prev, prev_ret)
    }

def generate_diagnosis(ep, current, prev, prev_ret):
    points = []
    if current.retention_50_min:
        points.append(f"黄金留存点：{current.retention_50_min}分钟")
    
    hook = "中"
    if current.retention_90_min and current.retention_90_min <= 1:
        hook = "强"
    elif current.retention_90_min and current.retention_90_min > 3:
        hook = "弱"
    points.append(f"钩子强度：{hook}")
    
    if prev_ret and current.retention_50_min and prev_ret.retention_50_min:
        diff = round(current.retention_50_min - prev_ret.retention_50_min, 1)
        sign = "+" if diff > 0 else ""
        points.append(f"对比上一集：留存拐点 {sign}{diff}分钟")
    
    return "，".join(points)
