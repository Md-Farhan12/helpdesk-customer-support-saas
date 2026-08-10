from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Helpdesk & Customer Support Ticketing SaaS",
    description="Backend API for managing customer support tickets and service operations.",
    version="0.1.0",
)

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