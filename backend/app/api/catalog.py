from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.category_repository import CategoryRepository
from app.repositories.priority_repository import PriorityRepository
from app.schemas.category import CategoryResponse
from app.schemas.priority import PriorityResponse


router = APIRouter(
    prefix="/catalog",
    tags=["Ticket Catalog"],
)


@router.get(
    "/categories",
    response_model=list[CategoryResponse],
)
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return active ticket categories."""

    return CategoryRepository(db).get_active()


@router.get(
    "/priorities",
    response_model=list[PriorityResponse],
)
def get_priorities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return active ticket priorities."""

    return PriorityRepository(db).get_active()