from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TicketBase(BaseModel):
    subject: str = Field(
        ...,
        min_length=5,
        max_length=200,
    )
    description: str = Field(
        ...,
        min_length=10,
    )
    category_id: int = Field(
        ...,
        gt=0,
    )
    priority_id: int = Field(
        ...,
        gt=0,
    )


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    subject: str | None = Field(
        default=None,
        min_length=5,
        max_length=200,
    )
    description: str | None = Field(
        default=None,
        min_length=10,
    )
    category_id: int | None = Field(
        default=None,
        gt=0,
    )
    priority_id: int | None = Field(
        default=None,
        gt=0,
    )
    status: str | None = None


class TicketResponse(TicketBase):
    id: int
    ticket_number: str
    customer_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    closed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total: int