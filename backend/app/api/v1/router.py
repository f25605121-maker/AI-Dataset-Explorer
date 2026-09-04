from fastapi import APIRouter
from backend.app.api.v1.problem import router as problem_router
from backend.app.api.v1.recommend import router as recommend_router
from backend.app.api.v1.search import router as search_router
from backend.app.api.v1.resources import router as resources_router
from backend.app.api.v1.feedback import router as feedback_router
from backend.app.api.v1.admin import router as admin_router

api_v1_router = APIRouter()

api_v1_router.include_router(problem_router, tags=["Problem Understanding"])
api_v1_router.include_router(recommend_router, tags=["Recommendation Engine"])
api_v1_router.include_router(search_router, tags=["Search"])
api_v1_router.include_router(resources_router, tags=["Resources"])
api_v1_router.include_router(feedback_router, tags=["User Feedback"])
api_v1_router.include_router(admin_router, tags=["Admin & Health"])
