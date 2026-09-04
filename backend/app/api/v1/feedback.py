from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.models.logs import Feedback
from backend.app.schemas.feedback import FeedbackRequest, FeedbackResponse

router = APIRouter()


@router.post("/feedback", response_model=FeedbackResponse)
async def record_feedback(
    request: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Records user feedback (thumbs up/down, click, bookmark) per Section 50.
    """
    entry = Feedback(
        resource_id=request.resource_id,
        resource_type=request.resource_type,
        action=request.action,
        user_id=request.user_id,
        comment=request.comment,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return FeedbackResponse(
        success=True,
        feedback_id=entry.id,
        message="User feedback recorded for ranking telemetry.",
    )
