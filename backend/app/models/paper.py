import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, JSON
from backend.app.db.session import Base
from backend.app.models.types import VectorType


class Paper(Base):
    __tablename__ = "papers"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(512), nullable=False, index=True)
    abstract = Column(Text, nullable=True)
    authors = Column(JSON, default=list)
    venue = Column(String(255), nullable=True)
    doi = Column(String(255), nullable=True, index=True)
    arxiv_id = Column(String(64), nullable=True, index=True)
    openalex_id = Column(String(128), nullable=True, index=True)
    publication_date = Column(String(32), nullable=True)
    year = Column(Integer, nullable=True, index=True)
    citation_count = Column(Integer, default=0, index=True)
    url = Column(String(512), nullable=True)
    pdf_url = Column(String(512), nullable=True)
    code_url = Column(String(512), nullable=True)
    tasks = Column(JSON, default=list)
    domains = Column(JSON, default=list)
    methods = Column(JSON, default=list)
    dataset_ids = Column(JSON, default=list)
    model_ids = Column(JSON, default=list)
    paper_type = Column(String(64), default="METHOD", index=True)
    source = Column(String(64), default="arxiv", index=True)
    source_id = Column(String(255), nullable=True, index=True)
    embedding = Column(VectorType, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
