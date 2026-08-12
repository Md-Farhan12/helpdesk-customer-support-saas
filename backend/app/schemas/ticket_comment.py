from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TicketCommentCreate(BaseModel):
    body: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class TicketCommentResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    body: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketCommentListResponse(BaseModel):
    items: list[TicketCommentResponse]
    total: int