from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import datetime
from typing import Dict, Any, List

from app import models, auth
from app.database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/")
def get_analytics(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.datetime.utcnow()
    
    # 1. Fetch all user tasks
    tasks = db.query(models.Task).options(joinedload(models.Task.category)).filter(models.Task.user_id == current_user.id).all()
    total_tasks = len(tasks)
    completed_tasks = [t for t in tasks if t.status == "Completed"]
    pending_tasks = [t for t in tasks if t.status == "Pending"]
    
    # Calculate Overdue
    overdue_tasks = []
    for t in pending_tasks:
        if t.due_date and t.due_date < now:
            overdue_tasks.append(t)
            
    completion_rate = round((len(completed_tasks) / total_tasks * 100) if total_tasks > 0 else 0, 1)

    # 2. Daily Productivity Trend (Last 7 Days)
    daily_trend = []
    for i in range(6, -1, -1):
        day = now.date() - datetime.timedelta(days=i)
        day_start = datetime.datetime.combine(day, datetime.time.min)
        day_end = datetime.datetime.combine(day, datetime.time.max)
        
        # Count completions in this day
        day_completions = [
            t for t in completed_tasks 
            if t.completed_at and day_start <= t.completed_at <= day_end
        ]
        
        # Calculate a weighted productivity score: High=3, Medium=2, Low=1
        score = 0
        for t in day_completions:
            if t.priority == "High":
                score += 3
            elif t.priority == "Medium":
                score += 2
            else:
                score += 1
                
        daily_trend.append({
            "date": day.strftime("%b %d"),
            "completed": len(day_completions),
            "score": score
        })

    # 3. Category Productivity Breakdown
    categories = db.query(models.Category).filter(models.Category.user_id == current_user.id).all()
    category_breakdown = []
    
    # Map for easy category lookup
    cat_map = {c.id: c for c in categories}
    cat_tasks: Dict[int, List[models.Task]] = {c.id: [] for c in categories}
    cat_tasks[None] = []  # For tasks with no category
    
    for t in tasks:
        cat_tasks[t.category_id].append(t)
        
    for cat_id, t_list in cat_tasks.items():
        if cat_id is None:
            if not t_list:
                continue
            name = "Uncategorized"
            color = "#94a3b8"
        else:
            cat = cat_map[cat_id]
            name = cat.name
            color = cat.color
            
        cat_total = len(t_list)
        cat_completed = len([t for t in t_list if t.status == "Completed"])
        cat_avg_delay = round(sum(t.delay_count for t in t_list) / cat_total if cat_total > 0 else 0, 1)
        cat_comp_rate = round((cat_completed / cat_total * 100) if cat_total > 0 else 0, 1)
        
        category_breakdown.append({
            "name": name,
            "color": color,
            "total": cat_total,
            "completed": cat_completed,
            "completion_rate": cat_comp_rate,
            "avg_delay": cat_avg_delay
        })

    # 4. Hourly Productivity Distribution (0-23)
    hourly_distribution = {h: 0 for h in range(24)}
    for t in completed_tasks:
        if t.completed_at:
            # Shift completion time from UTC to local (approximated or raw hour)
            # Since database stores UTC, let's just group by UTC hour
            hour = t.completed_at.hour
            hourly_distribution[hour] += 1
            
    hourly_data = [{"hour": f"{h:02d}:00", "completions": count} for h, count in hourly_distribution.items()]

    # 5. Smart AI Insights
    insights = []
    
    # Check if there are overdue tasks
    if overdue_tasks:
        insights.append(f"⚠️ You have {len(overdue_tasks)} overdue tasks pending. Tackle these first to reduce mental fatigue!")

    # Check for category delay patterns
    delay_cats = [c for c in category_breakdown if c["avg_delay"] > 1.0]
    if delay_cats:
        sorted_delay = sorted(delay_cats, key=lambda x: x["avg_delay"], reverse=True)
        worst_cat = sorted_delay[0]
        insights.append(
            f"🧠 Behavioral Insight: You tend to delay '{worst_cat['name']}' tasks the most "
            f"(rescheduled an average of {worst_cat['avg_delay']} times). Try allocating 15 minutes to start them early!"
        )
        
    # Check for overall completion levels
    if total_tasks > 0:
        if completion_rate >= 80:
            insights.append("🌟 Productivity Elite: Your task completion rate is exceptional! Keep up the momentum.")
        elif completion_rate >= 50:
            insights.append("👍 Good progress: You are consistently knocking out items. Review overdue tasks to speed up.")
        else:
            insights.append("💡 Tip: Try breaking large tasks into 5-minute subtasks to boost your overall completion speed.")
            
    if not insights:
        insights.append("📊 Add more tasks and log completions to unlock personalized productivity AI predictions.")

    return {
        "summary": {
            "total_tasks": total_tasks,
            "completed_tasks": len(completed_tasks),
            "pending_tasks": len(pending_tasks),
            "overdue_tasks": len(overdue_tasks),
            "completion_rate": completion_rate
        },
        "daily_trend": daily_trend,
        "category_breakdown": category_breakdown,
        "hourly_distribution": hourly_data,
        "insights": insights
    }
