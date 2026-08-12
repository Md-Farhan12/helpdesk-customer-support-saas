from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Business logic for user management and authentication."""

    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def create_user(self, user_data: UserCreate):
        """Create a new user with a securely hashed password."""
        existing_user = self.repository.get_by_email(user_data.email)

        if existing_user:
            raise ValueError("A user with this email already exists.")

        hashed_password = hash_password(user_data.password)

        return self.repository.create(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            role=user_data.role,
        )

    def authenticate_user(self, email: str, password: str):
        """Authenticate a user using their email and password."""
        user = self.repository.get_by_email(email)

        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        if not user.is_active:
            return None

        return user

    def get_user(self, user_id: int):
        """Get a user by ID."""
        return self.repository.get_by_id(user_id)

    def get_users(self):
        """Get all users."""
        return self.repository.get_all()

    def update_user(self, user_id: int, user_data: UserUpdate):
        """Update an existing user."""
        user = self.repository.get_by_id(user_id)

        if not user:
            return None

        update_data = user_data.model_dump(exclude_unset=True)

        if "email" in update_data:
            existing_user = self.repository.get_by_email(update_data["email"])

            if existing_user and existing_user.id != user.id:
                raise ValueError("A user with this email already exists.")

        for field, value in update_data.items():
            setattr(user, field, value)

        return self.repository.update(user)

    def delete_user(self, user_id: int):
        """Delete an existing user."""
        user = self.repository.get_by_id(user_id)

        if not user:
            return False

        self.repository.delete(user)

        return True