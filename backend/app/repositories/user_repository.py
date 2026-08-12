from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Repository for database operations related to users."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        """Return a user by ID."""
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        """Return a user by email address."""
        statement = select(User).where(User.email == email)
        return self.db.scalar(statement)

    def get_all(self) -> list[User]:
        """Return all users."""
        statement = select(User).order_by(User.id)
        return list(self.db.scalars(statement).all())

    def create(
        self,
        name: str,
        email: str,
        password_hash: str,
        role: str,
    ) -> User:
        """Create and persist a new user."""
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            role=role,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def update(self, user: User) -> User:
        """Persist changes to an existing user."""
        self.db.commit()
        self.db.refresh(user)

        return user

    def delete(self, user: User) -> None:
        """Delete a user from the database."""
        self.db.delete(user)
        self.db.commit()