from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.priority import Priority


class PriorityRepository:
    """Database operations for ticket priorities."""

    def __init__(self, db: Session):
        self.db = db

    def get_active(self) -> list[Priority]:
        statement = (
            select(Priority)
            .where(Priority.is_active.is_(True))
            .order_by(Priority.level.asc())
        )

        return list(self.db.execute(statement).scalars().all())

    def get_by_id(self, priority_id: int) -> Priority | None:
        statement = select(Priority).where(
            Priority.id == priority_id
        )

        return self.db.execute(statement).scalar_one_or_none()

    def create(
        self,
        *,
        name: str,
        level: int,
        description: str | None = None,
    ) -> Priority:
        priority = Priority(
            name=name,
            level=level,
            description=description,
        )

        self.db.add(priority)
        self.db.commit()
        self.db.refresh(priority)

        return priority