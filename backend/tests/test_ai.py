import pytest
import datetime
from app.ai_engine import parse_nlp_task, predict_task_priority

def test_nlp_parsing_today():
    # Test today keyword parsing
    res = parse_nlp_task("Remind me to finish coding react app today evening")
    assert "Coding" in res["category_name"]
    assert "react" in res["title"].lower()
    assert res["due_date"] is not None
    assert res["due_date"].hour == 18

def test_nlp_parsing_tomorrow_urgent():
    # Test tomorrow and urgency parsing
    res = parse_nlp_task("URGENT client presentation tomorrow morning")
    assert "Work" in res["category_name"]
    assert "presentation" in res["title"].lower()
    assert res["priority"] == "High"
    assert res["due_date"].hour == 9

def test_nlp_parsing_no_due_date():
    # Test default behaviors when no date is supplied
    res = parse_nlp_task("Buy groceries whenever you can")
    assert "Personal" in res["category_name"]
    assert "groceries" in res["title"].lower()
    assert res["due_date"] is None
    assert res["priority"] == "Low"

def test_nlp_parsing_academic_keywords():
    # Test that academic keywords automatically map to Studies and High priority
    res = parse_nlp_task("Submit physics lab tomorrow evening")
    assert res["category_name"] == "Studies"
    assert res["priority"] == "High"
    assert "physics" in res["title"].lower()
    assert res["due_date"] is not None
    assert res["due_date"].hour == 18
