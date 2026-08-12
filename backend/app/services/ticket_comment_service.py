from sqlalchemy.orm import Session

from app.models.ticket import Ticket
from app.models.ticket_comment import TicketComment
from app.repositories.ticket_comment_repository import (
    TicketCommentRepository,
)
from app.schemas.ticket_comment import TicketCommentCreate


class TicketCommentService:
    """Business logic for ticket comments."""

    def __init__(self, db: Session):
        self.db = db
        self.repository = TicketCommentRepository(db)

    def create_comment(
        self,
        ticket_id: int,
        user_id: int,
        role: str,
        comment_data: TicketCommentCreate,
    ) -> TicketComment:
        """Create a comment on an accessible ticket."""

        ticket = self.db.get(Ticket, ticket_id)

        if not ticket:
            raise LookupError("Ticket not found.")

        if role == "customer" and ticket.customer_id != user_id:
            raise PermissionError(
                "You do not have permission to comment on this ticket."
            )

        if role not in {
            "customer",
            "agent",
            "admin",
            "administrator",
        }:
            raise PermissionError(
                "You do not have permission to comment on tickets."
            )

        if ticket.status == "closed":
            raise ValueError(
                "Comments cannot be added to a closed ticket."
            )

        body = comment_data.body.strip()

        if not body:
            raise ValueError(
                "Comment cannot be empty."
            )

        return self.repository.create(
            ticket_id=ticket_id,
            user_id=user_id,
            body=body,
        )

    def get_ticket_comments(
        self,
        ticket_id: int,
        user_id: int,
        role: str,
    ) -> list[TicketComment]:
        """Return comments for an accessible ticket."""

        ticket = self.db.get(Ticket, ticket_id)

        if not ticket:
            raise LookupError("Ticket not found.")

        if role == "customer" and ticket.customer_id != user_id:
            raise PermissionError(
                "You do not have permission to view this ticket."
            )

        if role not in {
            "customer",
            "agent",
            "admin",
            "administrator",
        }:
            raise PermissionError(
                "You do not have permission to view ticket comments."
            )

        return self.repository.get_by_ticket(ticket_id)