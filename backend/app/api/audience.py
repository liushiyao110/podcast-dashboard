from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Audience
from app.schemas import AudienceOut

router = APIRouter()

@router.get("/", response_model=list[AudienceOut])
def list_audience(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Audience).order_by(Audience.record_date.desc()).limit(10).all()

@router.get("/latest", response_model=AudienceOut)
def get_latest_audience(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rec = db.query(Audience).order_by(Audience.record_date.desc()).first()
    return rec
