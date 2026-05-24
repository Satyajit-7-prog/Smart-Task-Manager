from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import datetime

from app import models, schemas, auth, ai_engine
from app.database import get_db

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[schemas.TaskResponse])
def read_tasks(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    category_id_filter: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Task).options(joinedload(models.Task.category)).filter(models.Task.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(models.Task.status == status_filter)
    if priority_filter:
        query = query.filter(models.Task.priority == priority_filter)
    if category_id_filter:
        query = query.filter(models.Task.category_id == category_id_filter)
        
    return query.order_by(models.Task.status.desc(), models.Task.due_date.asc()).all()

@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: schemas.TaskCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Lookup Category
    category_name = None
    if task_in.category_id:
        category = db.query(models.Category).filter(
            models.Category.id == task_in.category_id,
            models.Category.user_id == current_user.id
        ).first()
        if category:
            category_name = category.name
    
    # AI Priority Prediction: If not explicitly set or if default "Medium", we can suggest AI-based recommendation
    # Or, if user sets it, we store it. Let's predict priority automatically if priority is not specified or we can override if needed.
    predicted_priority, tip = ai_engine.predict_task_priority(
        title=task_in.title,
        due_date=task_in.due_date,
        category_name=category_name,
        user_id=current_user.id,
        db=db
    )

    # We default to AI prediction if not specified or we can record predicted priority
    task_priority = task_in.priority
    ai_predicted = False
    
    # If the user didn't change the default 'Medium' and we predicted 'High' or 'Low', or we just run prediction
    if task_in.priority == "Medium" and predicted_priority != "Medium":
        task_priority = predicted_priority
        ai_predicted = True

    task = models.Task(
        title=task_in.title,
        description=task_in.description,
        due_date=task_in.due_date,
        priority=task_priority,
        ai_predicted_priority=ai_predicted,
        category_id=task_in.category_id,
        user_id=current_user.id,
        status="Pending"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Activity Log
    log = models.ActivityLog(user_id=current_user.id, action="created_task")
    db.add(log)
    db.commit()

    # Load category relation for response serialization
    db_task = db.query(models.Task).options(joinedload(models.Task.category)).filter(models.Task.id == task.id).first()
    return db_task

@router.post("/nlp-quick-add", response_model=schemas.TaskResponse)
def nlp_quick_add(
    req: schemas.NLPParseRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Parse input text via AI Engine
    parsed = ai_engine.parse_nlp_task(req.text)
    
    # Find or Create Category
    category_id = None
    if parsed["category_name"]:
        cat = db.query(models.Category).filter(
            models.Category.user_id == current_user.id,
            models.Category.name == parsed["category_name"]
        ).first()
        
        if not cat:
            # Dynamically seed new category with custom color matching its vibe
            cat_colors = {
                "Coding": "#06b6d4", "Work": "#a855f7", "Studies": "#3b82f6",
                "Health": "#10b981", "Finance": "#f59e0b", "Personal": "#ec4899"
            }
            color = cat_colors.get(parsed["category_name"], "#6b7280")
            cat = models.Category(name=parsed["category_name"], color=color, user_id=current_user.id)
            db.add(cat)
            db.commit()
            db.refresh(cat)
            
        category_id = cat.id

    # Predict Priority using historical data on top of NLP parse
    predicted_priority, tip = ai_engine.predict_task_priority(
        title=parsed["title"],
        due_date=parsed["due_date"],
        category_name=parsed["category_name"],
        user_id=current_user.id,
        db=db
    )

    task = models.Task(
        title=parsed["title"],
        description=f"AI parsed from: '{req.text}'\n{parsed['explanation']}",
        due_date=parsed["due_date"],
        priority=predicted_priority if predicted_priority else parsed["priority"],
        ai_predicted_priority=True,
        category_id=category_id,
        user_id=current_user.id,
        status="Pending"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Activity Log
    log = models.ActivityLog(user_id=current_user.id, action="nlp_created_task")
    db.add(log)
    db.commit()

    db_task = db.query(models.Task).options(joinedload(models.Task.category)).filter(models.Task.id == task.id).first()
    return db_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    # Detect due date change to track reschedule/delay rates!
    if task_in.due_date is not None:
        new_due = task_in.due_date.replace(tzinfo=None) if task_in.due_date else None
        old_due = task.due_date.replace(tzinfo=None) if task.due_date else None
        if old_due and new_due and new_due > old_due:
            task.delay_count += 1
            # Log rescheduled action
            log = models.ActivityLog(user_id=current_user.id, action="rescheduled_task")
            db.add(log)

    # Handle completion logic
    if task_in.status == "Completed" and task.status != "Completed":
        task.completed_at = datetime.datetime.utcnow()
        # Log completed action
        log = models.ActivityLog(user_id=current_user.id, action="completed_task")
        db.add(log)
    elif task_in.status == "Pending" and task.status == "Completed":
        task.completed_at = None

    # Update other fields
    for field, value in task_in.model_dump(exclude_unset=True).items():
        if field != "delay_count":
            setattr(task, field, value)

    db.commit()
    db.refresh(task)

    db_task = db.query(models.Task).options(joinedload(models.Task.category)).filter(models.Task.id == task.id).first()
    return db_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    db.delete(task)
    db.commit()
    return
