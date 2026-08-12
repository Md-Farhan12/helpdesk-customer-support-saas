from pydantic import BaseModel, ConfigDict


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)