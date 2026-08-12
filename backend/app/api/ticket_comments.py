from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ticket_comment import (
    TicketCommentCreate,
    TicketCommentListResponse,
    TicketCommentResponse,
)
from app.services.ticket_comment_service import TicketCommentService


router = APIRouter(
    prefix="/tickets",
    tags=["Ticket Comments"],
)


@router.post(
    "/{ticket_id}/comments",
    response_model=TicketCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket_comment(
    ticket_id: int,
    comment_data: TicketCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a comment to an accessible ticket."""

    service = TicketCommentService(db)

    try:
        return service.create_comment(
            ticket_id=ticket_id,
            user_id=current_user.id,
            role=current_user.role,
            comment_data=comment_data,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/{ticket_id}/comments",
    response_model=TicketCommentListResponse,
)
def get_ticket_comments(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the conversation history for a ticket."""

    service = TicketCommentService(db)

    try:
        comments = service.get_ticket_comments(
            ticket_id=ticket_id,
            user_id=current_user.id,
            role=current_user.role,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    return {
        "items": comments,
        "total": len(comments),
    }