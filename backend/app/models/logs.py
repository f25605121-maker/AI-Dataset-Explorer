import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, JSON
from backend.app.db.session import Base


class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_query = Column(Text, nullable=False)
    problem_profile = Column(JSON, default=dict)
    candidate_counts = Column(JSON, default=dict)
    ranking_latency_ms = Column(Float, nullable=True)
    llm_latency_ms = Column(Float, nullable=True)
    final_recommendation_ids = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    resource_id = Column(String(64), nullable=False, index=True)
    resource_type = Column(String(32), nullable=False, index=True)  # dataset, model, paper
    action = Column(String(32), nullable=False)  # thumbs_up, thumbs_down, click, bookmark, open_pdf
    user_id = Column(String(64), nullable=True, index=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(64), nullable=False, index=True)  # huggingface, kaggle, arxiv, openalex
    status = Column(String(32), default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    items_indexed = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
