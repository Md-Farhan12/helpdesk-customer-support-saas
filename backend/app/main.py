from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.catalog import router as catalog_router
from app.api.ticket_comments import router as ticket_comments_router
from app.api.tickets import router as tickets_router
from app.core.database import Base, engine
from app.core.seed import seed_catalog
from app.models.user import User
from app.models.category import Category
from app.models.priority import Priority
from app.models.ticket_comment import TicketComment
from app.models.ticket import Ticket

app = FastAPI(
    title="Helpdesk & Customer Support Ticketing SaaS",
    description="Backend API for managing customer support tickets and service operations.",
    version="0.1.0",
)


# Create database tables from registered SQLAlchemy models
Base.metadata.create_all(bind=engine)
seed_catalog()

# Authentication routes
app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(catalog_router)
app.include_router(ticket_comments_router)
app.include_router(admin_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "success": True,
        "data": {
            "service": "Helpdesk & Customer Support Ticketing SaaS",
            "status": "running",
        },
        "message": "API is running successfully.",
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
        },
        "message": "Service is healthy.",
    }