import re
import datetime
from typing import Optional, Dict, Any, Tuple, List
from sqlalchemy.orm import Session
from app import models

def parse_nlp_task(text: str) -> Dict[str, Any]:
    """
    Parses natural language input to extract:
    - title
    - due_date (datetime)
    - priority ('High', 'Medium', 'Low')
    - category_name (Work, Studies, Coding, Health, Personal, Finance, etc.)
    - confidence (float)
    - explanation (str)
    """
    text_lower = text.lower()
    
    # Helper for robust whole-word checking
    def has_word(kw: str, txt: str) -> bool:
        return bool(re.search(r'\b' + re.escape(kw) + r'\b', txt))
        
    academic_keywords = ["physics", "lab", "assignment", "exam"]
    is_academic = any(has_word(kw, text_lower) for kw in academic_keywords)

    # 1. Extract Priority
    priority = "Medium"
    priority_explanation = "Defaulted to Medium priority."
    if any(has_word(word, text_lower) for word in ["urgent", "asap", "critical", "high priority", "immediately", "must do"]):
        priority = "High"
        priority_explanation = "Set to High priority due to urgency keywords."
    elif is_academic:
        priority = "High"
        priority_explanation = "Set to High priority due to academic keywords."
    elif any(has_word(word, text_lower) for word in ["whenever", "low priority", "low-priority", "some day", "someday"]):
        priority = "Low"
        priority_explanation = "Set to Low priority due to flexibility keywords."

    # 2. Extract Category
    category_map = {
        "Coding": ["code", "debug", "compile", "deploy", "git", "api", "backend", "frontend", "database", "programming", "ai", "ml", "react", "fastapi"],
        "Work": ["meeting", "client", "project", "report", "presentation", "interview", "call", "office", "task", "manager", "team"],
        "Studies": ["study", "exam", "quiz", "assignment", "homework", "read", "lecture", "book", "class", "course", "college", "school", "physics", "lab"],
        "Health": ["gym", "workout", "exercise", "doctor", "dentist", "run", "meds", "medicine", "health", "dentistry", "clinic"],
        "Finance": ["pay", "bill", "rent", "invoice", "bank", "credit", "tax", "salary", "expense"],
        "Personal": ["buy", "grocery", "groceries", "dinner", "movie", "clean", "vacuum", "laundry", "call mom", "gift", "shop"]
    }
    
    if is_academic:
        category_name = "Studies"
        category_found = True
    else:
        category_name = "Personal"  # Default
        category_found = False
        for cat, keywords in category_map.items():
            if any(has_word(keyword, text_lower) for keyword in keywords):
                category_name = cat
                category_found = True
                break

    category_explanation = f"Classified under '{category_name}' based on keywords." if category_found else f"Defaulted to '{category_name}' category."

    # 3. Extract Due Date and Time
    now = datetime.datetime.now()
    due_date = None
    date_explanation = "No specific deadline detected."
    confidence = 0.7

    # Time detection (e.g. 9 am, 3 pm, 18:00, evening, morning)
    target_hour = 12
    target_minute = 0
    time_match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', text_lower)
    
    # Simple relative date rules
    if "today" in text_lower:
        due_date = now
        date_explanation = "Detected 'today' as deadline."
        confidence += 0.1
    elif "tomorrow" in text_lower:
        due_date = now + datetime.timedelta(days=1)
        date_explanation = "Detected 'tomorrow' as deadline."
        confidence += 0.15
    elif "day after tomorrow" in text_lower or "in 2 days" in text_lower:
        due_date = now + datetime.timedelta(days=2)
        date_explanation = "Detected 'in 2 days' as deadline."
        confidence += 0.1
    elif "next week" in text_lower:
        due_date = now + datetime.timedelta(days=7)
        date_explanation = "Detected 'next week' (in 7 days) as deadline."
        confidence += 0.05
    else:
        # Check weekdays: e.g. "on monday", "this friday"
        weekdays = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }
        for day_name, day_idx in weekdays.items():
            if f"on {day_name}" in text_lower or f"this {day_name}" in text_lower or f"next {day_name}" in text_lower:
                days_ahead = day_idx - now.weekday()
                if days_ahead <= 0:  # Target day is next week
                    days_ahead += 7
                due_date = now + datetime.timedelta(days=days_ahead)
                date_explanation = f"Detected next '{day_name.capitalize()}' as deadline."
                confidence += 0.15
                break

    # Time adjustments
    if "morning" in text_lower:
        target_hour = 9
    elif "afternoon" in text_lower:
        target_hour = 14
    elif "evening" in text_lower:
        target_hour = 18
    elif "night" in text_lower or "tonight" in text_lower:
        target_hour = 21

    if due_date:
        due_date = due_date.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
    else:
        # Default to tomorrow end-of-day if not specified but urgent
        if priority == "High":
            due_date = (now + datetime.timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)
            date_explanation = "No date found; defaulted to tomorrow evening due to High priority."
            confidence -= 0.1
        else:
            date_explanation = "No deadline specified. Defaulted to no due date."

    # 4. Clean Task Title
    # Strip keywords we matched to clean up the task title
    clean_title = text
    # Remove phrases like "remind me to", "i need to", "add a task to"
    clean_title = re.sub(r'^(remind me to|i need to|please remind me to|add a task to|add task|schedule a|schedule|create a task to|to-do list:)\s*', '', clean_title, flags=re.IGNORECASE)
    
    # Strip out the date phrases
    for phrase in ["today", "tomorrow", "day after tomorrow", "in 2 days", "next week", "morning", "afternoon", "evening", "night", "tonight", "urgent", "asap", "critical"]:
        clean_title = re.sub(r'\b' + phrase + r'\b', '', clean_title, flags=re.IGNORECASE)

    # Strip weekday mentions (e.g. "on monday", "next friday")
    clean_title = re.sub(r'\b(on|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', '', clean_title, flags=re.IGNORECASE)
    
    # Clean whitespace
    clean_title = re.sub(r'\s+', ' ', clean_title).strip()
    clean_title = clean_title.strip(",.!? ")
    
    if not clean_title:
        clean_title = text  # Fallback to original text

    # Ensure title starts with capital letter
    clean_title = clean_title[0].upper() + clean_title[1:] if len(clean_title) > 0 else text

    explanation = f"AI Analysis: {date_explanation} {priority_explanation} {category_explanation}"
    
    return {
        "title": clean_title,
        "due_date": due_date,
        "priority": priority,
        "category_name": category_name,
        "confidence": round(min(confidence, 1.0), 2),
        "explanation": explanation
    }


def predict_task_priority(
    title: str,
    due_date: Optional[datetime.datetime],
    category_name: Optional[str],
    user_id: int,
    db: Session
) -> Tuple[str, str]:
    """
    Predicts priority based on due date proximity, category statistics, and completion history.
    Returns: (predicted_priority, smart_tip)
    """
    now = datetime.datetime.utcnow()
    score = 30  # Base Score (corresponds to Medium)
    tips = []

    # 1. Deadline Proximity Impact
    if due_date:
        # Convert naive datetime or ensure timezone match
        due_naive = due_date.replace(tzinfo=None)
        time_diff = due_naive - now
        hours_remaining = time_diff.total_seconds() / 3600

        if hours_remaining < 0:
            score += 50
            tips.append("⚠️ This task is already OVERDUE. Immediate attention required!")
        elif hours_remaining <= 12:
            score += 40
            tips.append("⏰ Due in less than 12 hours! Boosted to High priority.")
        elif hours_remaining <= 24:
            score += 30
            tips.append("📅 Due in less than 24 hours. Consider tackling this today.")
        elif hours_remaining <= 72:
            score += 15
            tips.append("🕒 Due within 3 days. Make sure to schedule some prep time.")
        else:
            score -= 10
            tips.append("⏳ Due in a few days. You have plenty of lead time.")

    # 2. Historical User Analysis for specific Category
    if category_name:
        # Find category
        cat = db.query(models.Category).filter(
            models.Category.user_id == user_id,
            models.Category.name == category_name
        ).first()

        if cat:
            # Analyze historical tasks in this category
            tasks_in_cat = db.query(models.Task).filter(
                models.Task.user_id == user_id,
                models.Task.category_id == cat.id
            ).all()

            if tasks_in_cat:
                total_tasks = len(tasks_in_cat)
                completed_tasks = [t for t in tasks_in_cat if t.status == "Completed"]
                delayed_tasks = [t for t in tasks_in_cat if t.delay_count > 0]
                
                # Completion rate
                completion_rate = len(completed_tasks) / total_tasks
                # Average delay count
                avg_delay = sum(t.delay_count for t in tasks_in_cat) / total_tasks

                if avg_delay > 1.0:
                    score += 15
                    tips.append(f"🧠 You historically reschedule '{category_name}' tasks. Try starting earlier to break the habit!")
                elif completion_rate < 0.5:
                    score += 10
                    tips.append(f"💡 You have a lower completion rate for '{category_name}' tasks. Break it into micro-tasks!")
                else:
                    tips.append(f"🌟 Excellent! You have a high completion speed for '{category_name}' tasks.")

    # 3. Keyword urgency
    title_lower = title.lower()
    
    # Helper for robust whole-word checking
    def has_word(kw: str, txt: str) -> bool:
        return bool(re.search(r'\b' + re.escape(kw) + r'\b', txt))
        
    academic_keywords = ["physics", "lab", "assignment", "exam"]
    is_academic = any(has_word(kw, title_lower) for kw in academic_keywords)

    if any(has_word(kw, title_lower) for kw in ["urgent", "asap", "boss", "critical", "client", "interview"]):
        score += 20
        tips.append("⚡ Urgent keywords detected in task title.")
        
    if is_academic:
        score += 35
        tips.append("⚡ Academic task detected; boosted to High priority.")

    # Determine Priority Category
    if is_academic:
        predicted_priority = "High"
    elif score >= 65:
        predicted_priority = "High"
    elif score >= 35:
        predicted_priority = "Medium"
    else:
        predicted_priority = "Low"

    # Select primary suggestion
    smart_tip = tips[0] if tips else "AI Recommendation: Standard priority level based on parameters."
    if len(tips) > 1:
        smart_tip = f"{tips[0]} {tips[1]}"

    return predicted_priority, smart_tip
