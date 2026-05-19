from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import io
from app.database import get_db
from app.auth import get_current_user, require_admin
from app.models import Episode, Retention, Audience, UpdateLog
from datetime import datetime

router = APIRouter()

@router.post("/csv")
def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    try:
        contents = file.file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {str(e)}")

    headers = list(df.columns)

    # Detect CSV type by columns
    if "集数" in headers or "episode_number" in headers:
        return _import_episodes(df, db, current_user)
    elif "留存90" in headers or "retention_90_min" in headers or "留存曲线" in str(file.filename).lower():
        return _import_retention(df, db, current_user)
    elif "男性比例" in headers or "male_pct" in headers or "听众" in str(file.filename).lower():
        return _import_audience(df, db, current_user)
    else:
        raise HTTPException(status_code=400, detail="无法识别 CSV 类型，请确保字段名正确")

def _import_episodes(df, db, current_user):
    count = 0
    for _, row in df.iterrows():
        ep_num = int(row.get("集数", row.get("episode_number", 0)) or 0)
        # Upsert: check if exists, update if so
        existing = db.query(Episode).filter(Episode.episode_number == ep_num).first()
        if existing:
            existing.title = str(row.get("标题", row.get("title", existing.title)))
            existing.publish_date = str(row.get("发布日期", row.get("publish_date", existing.publish_date)))
            existing.likes = int(row.get("点赞", row.get("likes", existing.likes)) or 0)
            existing.comments = int(row.get("评论", row.get("comments", existing.comments)) or 0)
            existing.bookmarks = int(row.get("收藏", row.get("bookmarks", existing.bookmarks)) or 0)
            existing.shares = int(row.get("分享", row.get("shares", existing.shares)) or 0)
            existing.completion_rate = float(row.get("完播率", row.get("completion_rate", existing.completion_rate)) or 0)
            existing.avg_play_duration = float(row.get("平均播放时长", row.get("avg_play_duration", existing.avg_play_duration)) or 0)
            existing.play_count = int(row.get("播放量", row.get("play_count", existing.play_count)) or 0)
        else:
            ep = Episode(
                episode_number=ep_num,
                title=str(row.get("标题", row.get("title", ""))),
                publish_date=str(row.get("发布日期", row.get("publish_date", ""))),
                likes=int(row.get("点赞", row.get("likes", 0)) or 0),
                comments=int(row.get("评论", row.get("comments", 0)) or 0),
                bookmarks=int(row.get("收藏", row.get("bookmarks", 0)) or 0),
                shares=int(row.get("分享", row.get("shares", 0)) or 0),
                completion_rate=float(row.get("完播率", row.get("completion_rate", 0)) or 0),
                avg_play_duration=float(row.get("平均播放时长", row.get("avg_play_duration", 0)) or 0),
                play_count=int(row.get("播放量", row.get("play_count", 0)) or 0),
            )
            db.add(ep)
        count += 1

    _log_update(db, current_user, "episodes_csv", count)
    return {"imported": count, "message": f"成功导入 {count} 条单集数据（含更新）"}

def _import_retention(df, db, current_user):
    count = 0
    for _, row in df.iterrows():
        ep_num = int(row.get("集数", row.get("episode_number", 0)) or 0)
        existing = db.query(Retention).filter(Retention.episode_number == ep_num).first()
        if existing:
            existing.retention_90_min = float(row.get("留存90", row.get("retention_90_min", existing.retention_90_min)) or 0)
            existing.retention_80_min = float(row.get("留存80", row.get("retention_80_min", existing.retention_80_min)) or 0)
            existing.retention_75_min = float(row.get("留存75", row.get("retention_75_min", existing.retention_75_min)) or 0)
            existing.retention_50_min = float(row.get("留存50", row.get("retention_50_min", existing.retention_50_min)) or 0)
            existing.retention_25_min = float(row.get("留存25", row.get("retention_25_min", existing.retention_25_min)) or 0)
            existing.retention_10_min = float(row.get("留存10", row.get("retention_10_min", existing.retention_10_min)) or 0)
            # Full retention data if provided
            if "完整留存" in row or "full_retention" in row:
                val = row.get("完整留存", row.get("full_retention", ""))
                if val and str(val) != "nan":
                    existing.full_retention_data = str(val)
        else:
            ret = Retention(
                episode_number=ep_num,
                retention_90_min=float(row.get("留存90", row.get("retention_90_min", 0)) or 0),
                retention_80_min=float(row.get("留存80", row.get("retention_80_min", 0)) or 0),
                retention_75_min=float(row.get("留存75", row.get("retention_75_min", 0)) or 0),
                retention_50_min=float(row.get("留存50", row.get("retention_50_min", 0)) or 0),
                retention_25_min=float(row.get("留存25", row.get("retention_25_min", 0)) or 0),
                retention_10_min=float(row.get("留存10", row.get("retention_10_min", 0)) or 0),
            )
            if "完整留存" in row or "full_retention" in row:
                val = row.get("完整留存", row.get("full_retention", ""))
                if val and str(val) != "nan":
                    ret.full_retention_data = str(val)
            db.add(ret)
        count += 1

    _log_update(db, current_user, "retention_csv", count)
    return {"imported": count, "message": f"成功导入 {count} 条留存数据（含更新）"}

def _import_audience(df, db, current_user):
    count = 0
    for _, row in df.iterrows():
        date = str(row.get("日期", row.get("record_date", "")))
        existing = db.query(Audience).filter(Audience.record_date == date).first()
        if existing:
            existing.male_pct = float(row.get("男性比例", row.get("male_pct", existing.male_pct)) or 0)
            existing.female_pct = float(row.get("女性比例", row.get("female_pct", existing.female_pct)) or 0)
            existing.age_under_18 = float(row.get("18岁以下", row.get("age_under_18", existing.age_under_18)) or 0)
            existing.age_18_22 = float(row.get("18-22岁", row.get("age_18_22", existing.age_18_22)) or 0)
            existing.age_23_28 = float(row.get("23-28岁", row.get("age_23_28", existing.age_23_28)) or 0)
            existing.age_29_35 = float(row.get("29-35岁", row.get("age_29_35", existing.age_29_35)) or 0)
            existing.age_36_40 = float(row.get("36-40岁", row.get("age_36_40", existing.age_36_40)) or 0)
            existing.age_over_40 = float(row.get("40岁以上", row.get("age_over_40", existing.age_over_40)) or 0)
        else:
            aud = Audience(
                record_date=date,
                male_pct=float(row.get("男性比例", row.get("male_pct", 0)) or 0),
                female_pct=float(row.get("女性比例", row.get("female_pct", 0)) or 0),
                age_under_18=float(row.get("18岁以下", row.get("age_under_18", 0)) or 0),
                age_18_22=float(row.get("18-22岁", row.get("age_18_22", 0)) or 0),
                age_23_28=float(row.get("23-28岁", row.get("age_23_28", 0)) or 0),
                age_29_35=float(row.get("29-35岁", row.get("age_29_35", 0)) or 0),
                age_36_40=float(row.get("36-40岁", row.get("age_36_40", 0)) or 0),
                age_over_40=float(row.get("40岁以上", row.get("age_over_40", 0)) or 0),
            )
            db.add(aud)
        count += 1

    _log_update(db, current_user, "audience_csv", count)
    return {"imported": count, "message": f"成功导入 {count} 条听众画像数据（含更新）"}

def _log_update(db, current_user, update_type, episodes_updated):
    log = UpdateLog(
        update_time=datetime.now().isoformat(),
        update_type=update_type,
        episodes_updated=episodes_updated,
        operator=current_user.username
    )
    db.add(log)
    db.commit()
