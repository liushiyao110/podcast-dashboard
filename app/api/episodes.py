from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app.database import get_db
from app.auth import get_current_user
from app.models import Episode
from app.schemas import EpisodeOut, EpisodeCreate

router = APIRouter()

@router.get("/", response_model=list[EpisodeOut])
def list_episodes(
    limit: int = Query(50, ge=1, le=200),
    sort_by: Optional[str] = Query("publish_date"),
    order: Optional[str] = Query("desc"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Episode)
    col = getattr(Episode, sort_by, Episode.publish_date)
    if order == "desc":
        q = q.order_by(desc(col))
    else:
        q = q.order_by(col)
    return q.limit(limit).all()

@router.get("/{ep_id}", response_model=EpisodeOut)
def get_episode(ep_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ep = db.query(Episode).filter(Episode.id == ep_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Episode not found")
    return ep

@router.post("/", response_model=EpisodeOut)
def create_episode(data: EpisodeCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ep = Episode(**data.dict())
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return ep
