from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category


class CategoryRepository:
    """Database operations for ticket categories."""

    def __init__(self, db: Session):
        self.db = db

    def get_active(self) -> list[Category]:
        statement = (
            select(Category)
            .where(Category.is_active.is_(True))
            .order_by(Category.name.asc())
        )

        return list(self.db.execute(statement).scalars().all())

    def get_by_id(self, category_id: int) -> Category | None:
        statement = select(Category).where(
            Category.id == category_id
        )

        return self.db.execute(statement).scalar_one_or_none()

    def create(
        self,
        *,
        name: str,
        description: str | None = None,
    ) -> Category:
        category = Category(
            name=name,
            description=description,
        )

        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)

        return category