from fastapi import APIRouter, Body
from backend.app.schemas.problem_profile import ProblemProfile
from backend.app.services.problem_understanding.parser import ProblemUnderstandingEngine

router = APIRouter()
parser = ProblemUnderstandingEngine()


@router.post("/problem/analyze", response_model=ProblemProfile)
async def analyze_problem(query: str = Body(..., embed=True)):
    """
    Analyzes natural language research problem and returns structured ProblemProfile (Section 6, 7).
    """
    return await parser.analyze_problem(query)
