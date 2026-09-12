from pydantic import BaseModel, Field


class ProjectionRequest(BaseModel):
    current_age: int = Field(ge=0, le=64)
    life_cover: float = Field(ge=0)
    premium: float = Field(ge=0)
    kiwisaver_balance: float = Field(ge=0)
    salary: float = Field(ge=0)
    kiwisaver_rate: float = Field(ge=0)
    investment_type: str = "balanced"
