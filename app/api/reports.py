from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import get_current_user
from app.models import Episode, Audience, UpdateLog
from typing import List

router = APIRouter()

@router.get("/weekly")
def weekly_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    episodes = db.query(Episode).order_by(Episode.publish_date.desc()).limit(10).all()
    latest = episodes[0] if episodes else None
    
    total_plays = db.query(func.sum(Episode.play_count)).scalar() or 0
    avg_completion = db.query(func.avg(Episode.completion_rate)).scalar() or 0.0
    
    # Find best performing episode
    best_ep = db.query(Episode).order_by(Episode.play_count.desc()).first()
    
    # Count updates in last 14 days
    from datetime import datetime, timedelta
    recent_logs = db.query(UpdateLog).filter(
        UpdateLog.update_time >= (datetime.now() - timedelta(days=14)).isoformat()
    ).all()
    
    # Audience trend
    audience = db.query(Audience).order_by(Audience.record_date.desc()).limit(2).all()
    
    report_lines = []
    report_lines.append(f"📊 《保持含人量》数据周报")
    report_lines.append(f"")
    
    if latest:
        report_lines.append(f"最新单集：第{latest.episode_number}期《{latest.title}》")
        report_lines.append(f"总播放量：{int(total_plays):,} | 平均完播率：{round(float(avg_completion), 1)}%")
    
    if best_ep:
        report_lines.append(f"表现最佳：第{best_ep.episode_number}期《{best_ep.title}》，播放量 {best_ep.play_count:,}")
    
    if len(episodes) >= 2:
        recent = episodes[:2]
        diff_completion = recent[0].completion_rate - recent[1].completion_rate
        sign = "+" if diff_completion > 0 else ""
        report_lines.append(f"近期完播率变化：{sign}{round(diff_completion, 1)}%")
    
    if audience and len(audience) >= 2:
        male_change = audience[0].male_pct - audience[1].male_pct
        sign = "+" if male_change > 0 else ""
        report_lines.append(f"男性听众占比变化：{sign}{round(male_change, 1)}%")
    
    if recent_logs:
        report_lines.append(f"近14天数据更新：{len(recent_logs)} 次")
    
    # Generate diagnosis
    diagnosis = []
    if avg_completion >= 70:
        diagnosis.append("整体内容吸引力强，完播率表现优秀")
    elif avg_completion >= 50:
        diagnosis.append("内容吸引力良好，完播率处于健康水平")
    else:
        diagnosis.append("完播率偏低，建议优化内容节奏或钩子设计")
    
    if best_ep and best_ep.play_count > 10000:
        diagnosis.append("存在爆款潜力，可复盘成功经验")
    
    return {
        "title": "《保持含人量》数据周报",
        "generated_at": datetime.now().isoformat(),
        "summary": "\n".join(report_lines),
        "diagnosis": "\n".join(diagnosis),
        "key_metrics": {
            "total_plays": int(total_plays),
            "avg_completion_rate": round(float(avg_completion), 1),
            "best_episode": {
                "id": best_ep.id if best_ep else None,
                "title": best_ep.title if best_ep else None,
                "play_count": best_ep.play_count if best_ep else 0,
            },
            "recent_updates": len(recent_logs),
        }
    }

@router.get("/episodes/{ep_id}")
def episode_report(ep_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    ep = db.query(Episode).filter(Episode.id == ep_id).first()
    if not ep:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Episode not found")
    
    # Compare with previous
    prev = db.query(Episode).filter(Episode.episode_number < ep.episode_number).order_by(Episode.episode_number.desc()).first()
    
    report = {
        "episode": {
            "number": ep.episode_number,
            "title": ep.title,
            "play_count": ep.play_count,
            "completion_rate": ep.completion_rate,
            "likes": ep.likes,
            "comments": ep.comments,
        },
        "diagnosis": [],
    }
    
    # Play count diagnosis
    if prev:
        play_diff = ep.play_count - prev.play_count
        sign = "+" if play_diff > 0 else ""
        report["diagnosis"].append(f"播放量较上集：{sign}{play_diff:,}")
        
        comp_diff = ep.completion_rate - prev.completion_rate
        sign = "+" if comp_diff > 0 else ""
        report["diagnosis"].append(f"完播率较上集：{sign}{round(comp_diff, 1)}%")
    
    if ep.completion_rate >= 75:
        report["diagnosis"].append("✅ 完播率优秀，内容节奏把控出色")
    elif ep.completion_rate >= 50:
        report["diagnosis"].append("⚠️ 完播率中等，建议优化开头钩子")
    else:
        report["diagnosis"].append("❌ 完播率偏低，需重新审视内容结构")
    
    # Engagement
    engagement = ep.likes + ep.comments + ep.bookmarks + ep.shares
    if engagement > 500:
        report["diagnosis"].append("互动数据活跃，听众参与度高")
    
    return report
