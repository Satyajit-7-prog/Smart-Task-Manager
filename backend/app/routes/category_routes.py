from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[schemas.CategoryResponse])
def read_categories(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Category).filter(models.Category.user_id == current_user.id).all()

@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: schemas.CategoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if category already exists for user
    existing = db.query(models.Category).filter(
        models.Category.user_id == current_user.id,
        models.Category.name == category_in.name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists."
        )

    category = models.Category(
        name=category_in.name,
        color=category_in.color,
        user_id=current_user.id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{cat_id}", response_model=schemas.CategoryResponse)
def update_category(
    cat_id: int,
    category_in: schemas.CategoryCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(models.Category).filter(
        models.Category.id == cat_id,
        models.Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")

    category.name = category_in.name
    category.color = category_in.color
    db.commit()
    db.refresh(category)
    return category

@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    cat_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(models.Category).filter(
        models.Category.id == cat_id,
        models.Category.user_id == current_user.id
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")

    db.delete(category)
    db.commit()
    return
