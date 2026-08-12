from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ticket_comment import TicketComment


class TicketCommentRepository:
    """Database operations for ticket comments."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        ticket_id: int,
        user_id: int,
        body: str,
    ) -> TicketComment:
        comment = TicketComment(
            ticket_id=ticket_id,
            user_id=user_id,
            body=body,
        )

        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)

        return comment

    def get_by_id(
        self,
        comment_id: int,
    ) -> TicketComment | None:
        statement = select(TicketComment).where(
            TicketComment.id == comment_id
        )

        return self.db.execute(
            statement
        ).scalar_one_or_none()

    def get_by_ticket(
        self,
        ticket_id: int,
    ) -> list[TicketComment]:
        statement = (
            select(TicketComment)
            .where(TicketComment.ticket_id == ticket_id)
            .order_by(TicketComment.created_at.asc())
        )

        return list(
            self.db.execute(statement).scalars().all()
        )

    def update(
        self,
        comment: TicketComment,
    ) -> TicketComment:
        self.db.commit()
        self.db.refresh(comment)

        return comment

    def delete(
        self,
        comment: TicketComment,
    ) -> None:
        self.db.delete(comment)
        self.db.commit()