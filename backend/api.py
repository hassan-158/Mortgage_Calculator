from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.calculator import calculate_projection as run_projection
from backend.models import ProjectionInputs, ProjectionResult

app = FastAPI(title="Property Financial Projection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/calculate", response_model=ProjectionResult)
def calculate_projection(inputs: ProjectionInputs) -> ProjectionResult:
    return run_projection(inputs)
