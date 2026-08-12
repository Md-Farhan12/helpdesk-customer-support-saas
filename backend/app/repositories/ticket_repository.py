from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ticket import Ticket


class TicketRepository:
    """Database operations for support tickets."""

    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        ticket_number: str,
        customer_id: int,
        category_id: int,
        priority_id: int,
        subject: str,
        description: str,
    ) -> Ticket:
        ticket = Ticket(
            ticket_number=ticket_number,
            customer_id=customer_id,
            category_id=category_id,
            priority_id=priority_id,
            subject=subject,
            description=description,
            status="open",
        )

        self.db.add(ticket)
        self.db.commit()
        self.db.refresh(ticket)

        return ticket

    def get_by_id(
        self,
        ticket_id: int,
    ) -> Ticket | None:
        statement = select(Ticket).where(
            Ticket.id == ticket_id
        )

        return self.db.execute(
            statement
        ).scalar_one_or_none()

    def get_by_ticket_number(
        self,
        ticket_number: str,
    ) -> Ticket | None:
        statement = select(Ticket).where(
            Ticket.ticket_number == ticket_number
        )

        return self.db.execute(
            statement
        ).scalar_one_or_none()

    def get_by_customer(
        self,
        customer_id: int,
    ) -> list[Ticket]:
        statement = (
            select(Ticket)
            .where(
                Ticket.customer_id == customer_id
            )
            .order_by(
                Ticket.created_at.desc()
            )
        )

        return list(
            self.db.execute(statement)
            .scalars()
            .all()
        )

    def get_by_agent(
        self,
        agent_id: int,
    ) -> list[Ticket]:
        """Get all tickets assigned to a support agent."""

        statement = (
            select(Ticket)
            .where(
                Ticket.assigned_agent_id == agent_id
            )
            .order_by(
                Ticket.created_at.desc()
            )
        )

        return list(
            self.db.execute(statement)
            .scalars()
            .all()
        )

    def get_all(self) -> list[Ticket]:
        statement = select(Ticket).order_by(
            Ticket.created_at.desc()
        )

        return list(
            self.db.execute(statement)
            .scalars()
            .all()
        )

    def update(
        self,
        ticket: Ticket,
    ) -> Ticket:
        self.db.commit()
        self.db.refresh(ticket)

        return ticket