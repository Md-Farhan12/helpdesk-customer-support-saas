from fastapi import FastAPI

app = FastAPI(
    title="Helpdesk & Customer Support Ticketing SaaS",
    description="Backend API for managing customer support tickets and service operations.",
    version="0.1.0",
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