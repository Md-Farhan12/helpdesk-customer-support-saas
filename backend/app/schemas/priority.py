from pydantic import BaseModel, ConfigDict


class PriorityResponse(BaseModel):
    id: int
    name: str
    level: int
    description: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)