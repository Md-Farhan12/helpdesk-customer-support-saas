from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_agent_or_admin,
)
from app.models.user import User
from app.schemas.ticket import (
    TicketCreate,
    TicketListResponse,
    TicketResponse,
    TicketUpdate,
)
from app.services.ticket_service import TicketService


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"],
)


@router.post(
    "",
    response_model=TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_ticket(
    ticket_data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a support ticket."""

    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can create support tickets.",
        )

    service = TicketService(db)

    try:
        return service.create_ticket(
            customer_id=current_user.id,
            ticket_data=ticket_data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/my",
    response_model=TicketListResponse,
)
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated customer's tickets."""

    service = TicketService(db)

    tickets = service.get_customer_tickets(
        customer_id=current_user.id,
    )

    return {
        "items": tickets,
        "total": len(tickets),
    }


@router.get(
    "/all",
    response_model=TicketListResponse,
)
def get_all_tickets(
    current_user: User = Depends(require_agent_or_admin),
    db: Session = Depends(get_db),
):
    """Return all tickets for support agents and administrators."""

    service = TicketService(db)

    tickets = service.get_all_tickets()

    return {
        "items": tickets,
        "total": len(tickets),
    }


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a ticket accessible to the authenticated user."""

    service = TicketService(db)

    try:
        ticket = service.get_ticket(
            ticket_id=ticket_id,
            user_id=current_user.id,
            role=current_user.role,
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )

    return ticket


@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a ticket according to the user's role."""

    service = TicketService(db)

    try:
        ticket = service.update_ticket(
            ticket_id=ticket_id,
            ticket_data=ticket_data,
            user_id=current_user.id,
            role=current_user.role,
        )

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

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )

    return ticket


@router.post(
    "/{ticket_id}/assign",
    response_model=TicketResponse,
)
def assign_ticket(
    ticket_id: int,
    agent_id: int,
    current_user: User = Depends(require_agent_or_admin),
    db: Session = Depends(get_db),
):
    """Assign a ticket to a support agent."""

    if current_user.role not in {
        "admin",
        "administrator",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can assign tickets.",
        )

    service = TicketService(db)

    try:
        ticket = service.assign_ticket(
            ticket_id=ticket_id,
            agent_id=agent_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )

    return ticket


@router.post(
    "/{ticket_id}/unassign",
    response_model=TicketResponse,
)
def unassign_ticket(
    ticket_id: int,
    current_user: User = Depends(require_agent_or_admin),
    db: Session = Depends(get_db),
):
    """Remove the assigned support agent from a ticket."""

    if current_user.role not in {
        "admin",
        "administrator",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can unassign tickets.",
        )

    service = TicketService(db)

    try:
        ticket = service.unassign_ticket(
            ticket_id=ticket_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )

    return ticket