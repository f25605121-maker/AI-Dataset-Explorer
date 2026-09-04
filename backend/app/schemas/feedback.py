from typing import Optional, Literal
from pydantic import BaseModel


class FeedbackRequest(BaseModel):
    resource_id: str
    resource_type: Literal["dataset", "model", "paper"]
    action: Literal["thumbs_up", "thumbs_down", "click", "bookmark", "open_pdf"]
    user_id: Optional[str] = None
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    success: bool
    feedback_id: str
    message: str = "Feedback recorded successfully."
