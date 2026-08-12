from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.priority import Priority
from app.models.ticket import Ticket
from app.models.user import User
from app.repositories.ticket_repository import TicketRepository
from app.schemas.ticket import TicketCreate, TicketUpdate


class TicketService:
    """Business logic for customer support tickets."""

    ALLOWED_STATUSES = {
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "closed",
    }

    STATUS_TRANSITIONS = {
        "open": {"assigned"},
        "assigned": {"in_progress"},
        "in_progress": {"resolved"},
        "resolved": {"closed"},
        "closed": set(),
    }

    def __init__(self, db: Session):
        self.db = db
        self.repository = TicketRepository(db)

    def _generate_ticket_number(self) -> str:
        """Generate a unique ticket number."""

        last_ticket = self.db.execute(
            select(Ticket).order_by(Ticket.id.desc())
        ).scalars().first()

        next_id = (last_ticket.id + 1) if last_ticket else 1

        return f"TKT-{next_id:06d}"

    def create_ticket(
        self,
        customer_id: int,
        ticket_data: TicketCreate,
    ):
        """Create a new support ticket."""

        category = self.db.get(
            Category,
            ticket_data.category_id,
        )

        if not category or not category.is_active:
            raise ValueError(
                "Selected category is not available."
            )

        priority = self.db.get(
            Priority,
            ticket_data.priority_id,
        )

        if not priority or not priority.is_active:
            raise ValueError(
                "Selected priority is not available."
            )

        ticket_number = self._generate_ticket_number()

        return self.repository.create(
            ticket_number=ticket_number,
            customer_id=customer_id,
            category_id=ticket_data.category_id,
            priority_id=ticket_data.priority_id,
            subject=ticket_data.subject,
            description=ticket_data.description,
        )

    def get_ticket(
        self,
        ticket_id: int,
        user_id: int,
        role: str,
    ):
        """Get a ticket according to the user's role."""

        ticket = self.repository.get_by_id(ticket_id)

        if not ticket:
            return None

        if role == "customer":
            if ticket.customer_id != user_id:
                raise PermissionError(
                    "You do not have permission to access this ticket."
                )

        elif role == "agent":
            if ticket.assigned_agent_id != user_id:
                raise PermissionError(
                    "You do not have permission to access this ticket."
                )

        return ticket

    def get_customer_tickets(
        self,
        customer_id: int,
    ):
        """Get all tickets belonging to a customer."""

        return self.repository.get_by_customer(
            customer_id
        )

    def get_agent_tickets(
        self,
        agent_id: int,
    ):
        """Get all tickets assigned to a support agent."""

        return self.repository.get_by_agent(
            agent_id
        )

    def get_all_tickets(self):
        """Get all tickets for support users."""

        return self.repository.get_all()

    def assign_ticket(
        self,
        ticket_id: int,
        agent_id: int,
    ):
        """Assign a ticket to a support agent."""

        ticket = self.repository.get_by_id(ticket_id)

        if not ticket:
            return None

        agent = self.db.get(User, agent_id)

        if not agent:
            raise ValueError(
                "Support agent not found."
            )

        if agent.role not in {"agent"}:
            raise ValueError(
                "Selected user is not a support agent."
            )

        if not agent.is_active:
            raise ValueError(
                "Selected support agent is inactive."
            )

        if ticket.status == "closed":
            raise ValueError(
                "Closed tickets cannot be assigned."
            )

        ticket.assigned_agent_id = agent.id

        if ticket.status == "open":
            ticket.status = "assigned"

        return self.repository.update(ticket)

    def unassign_ticket(
        self,
        ticket_id: int,
    ):
        """Remove the assigned support agent from a ticket."""

        ticket = self.repository.get_by_id(ticket_id)

        if not ticket:
            return None

        if ticket.status == "closed":
            raise ValueError(
                "Closed tickets cannot be unassigned."
            )

        ticket.assigned_agent_id = None

        if ticket.status == "assigned":
            ticket.status = "open"

        return self.repository.update(ticket)

    def update_ticket(
        self,
        ticket_id: int,
        ticket_data: TicketUpdate,
        user_id: int,
        role: str,
    ):
        """Update a ticket according to role and workflow rules."""

        ticket = self.repository.get_by_id(ticket_id)

        if not ticket:
            return None

        if role == "customer":
            if ticket.customer_id != user_id:
                raise PermissionError(
                    "You do not have permission to modify this ticket."
                )

            allowed_fields = {
                "subject",
                "description",
            }

            update_data = ticket_data.model_dump(
                exclude_unset=True
            )

            unauthorized_fields = (
                set(update_data) - allowed_fields
            )

            if unauthorized_fields:
                raise PermissionError(
                    "Customers cannot modify ticket status, "
                    "category, or priority."
                )

        elif role == "agent":
            if ticket.assigned_agent_id != user_id:
                raise PermissionError(
                    "You can only modify tickets assigned to you."
                )

            update_data = ticket_data.model_dump(
                exclude_unset=True
            )

            if "assigned_agent_id" in update_data:
                raise PermissionError(
                    "Support agents cannot change ticket assignment."
                )

        elif role in {
            "admin",
            "administrator",
        }:
            update_data = ticket_data.model_dump(
                exclude_unset=True
            )

        else:
            raise PermissionError(
                "You do not have permission to modify tickets."
            )

        if "category_id" in update_data:
            category = self.db.get(
                Category,
                update_data["category_id"],
            )

            if not category or not category.is_active:
                raise ValueError(
                    "Selected category is not available."
                )

        if "priority_id" in update_data:
            priority = self.db.get(
                Priority,
                update_data["priority_id"],
            )

            if not priority or not priority.is_active:
                raise ValueError(
                    "Selected priority is not available."
                )

        if "status" in update_data:
            new_status = update_data["status"]

            if role == "customer":
                raise PermissionError(
                    "Customers cannot change ticket status."
                )

            if new_status not in self.ALLOWED_STATUSES:
                raise ValueError(
                    f"Invalid ticket status: {new_status}"
                )

            current_status = ticket.status

            if new_status != current_status:
                allowed_next_statuses = (
                    self.STATUS_TRANSITIONS[current_status]
                )

                if new_status not in allowed_next_statuses:
                    raise ValueError(
                        f"Invalid status transition: "
                        f"{current_status} -> {new_status}"
                    )

                if new_status == "assigned":
                    if not ticket.assigned_agent_id:
                        raise ValueError(
                            "A support agent must be assigned "
                            "before the ticket can be marked assigned."
                        )

                if new_status == "resolved":
                    ticket.resolved_at = datetime.utcnow()

                if new_status == "closed":
                    ticket.closed_at = datetime.utcnow()

        for field, value in update_data.items():
            setattr(ticket, field, value)

        return self.repository.update(ticket)