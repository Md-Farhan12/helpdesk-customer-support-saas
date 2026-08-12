from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.category import Category
from app.models.priority import Priority


DEFAULT_CATEGORIES = [
    {
        "name": "Technical Support",
        "description": "Technical problems and product issues.",
    },
    {
        "name": "Account & Login",
        "description": "Account access, login, and authentication issues.",
    },
    {
        "name": "Billing",
        "description": "Billing, invoices, and payment-related issues.",
    },
    {
        "name": "General Inquiry",
        "description": "General customer questions and requests.",
    },
]


DEFAULT_PRIORITIES = [
    {
        "name": "Low",
        "level": 1,
        "description": "Issue has minimal impact.",
    },
    {
        "name": "Medium",
        "level": 2,
        "description": "Issue requires normal support attention.",
    },
    {
        "name": "High",
        "level": 3,
        "description": "Issue has significant customer impact.",
    },
    {
        "name": "Critical",
        "level": 4,
        "description": "Urgent issue requiring immediate attention.",
    },
]


def seed_catalog() -> None:
    """Create default categories and priorities if they do not exist."""

    db = SessionLocal()

    try:
        for category_data in DEFAULT_CATEGORIES:
            existing_category = db.execute(
                select(Category).where(
                    Category.name == category_data["name"]
                )
            ).scalar_one_or_none()

            if not existing_category:
                db.add(Category(**category_data))

        for priority_data in DEFAULT_PRIORITIES:
            existing_priority = db.execute(
                select(Priority).where(
                    Priority.name == priority_data["name"]
                )
            ).scalar_one_or_none()

            if not existing_priority:
                db.add(Priority(**priority_data))

        db.commit()

    finally:
        db.close()