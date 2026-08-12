from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.user import UserUpdate
from app.services.user_service import UserService


router = APIRouter(
    prefix="/admin",
    tags=["Administrator"],
)


@router.get("/users")
def get_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return all users for administrator management."""

    user_service = UserService(db)

    users = user_service.get_users()

    return {
        "success": True,
        "data": users,
        "message": "Users retrieved successfully.",
    }


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update a user's account information."""

    user_service = UserService(db)

    try:
        user = user_service.update_user(
            user_id,
            user_data,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return {
        "success": True,
        "data": user,
        "message": "User updated successfully.",
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a user account."""

    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot delete their own account.",
        )

    user_service = UserService(db)

    deleted = user_service.delete_user(user_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return {
        "success": True,
        "data": None,
        "message": "User deleted successfully.",
    }