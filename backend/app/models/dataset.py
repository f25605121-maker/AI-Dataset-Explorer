import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, JSON
from backend.app.db.session import Base
from backend.app.models.types import VectorType


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    source = Column(String(64), nullable=False, default="huggingface", index=True)
    source_id = Column(String(255), nullable=True, index=True)
    canonical_url = Column(String(512), nullable=True)
    license = Column(String(128), nullable=True)
    domain = Column(String(128), nullable=True, index=True)
    subdomains = Column(JSON, default=list)
    tasks = Column(JSON, default=list)
    modalities = Column(JSON, default=list)
    num_samples = Column(Integer, nullable=True)
    size_gb = Column(Float, nullable=True)
    languages = Column(JSON, default=list)
    format = Column(JSON, default=list)
    label_information = Column(JSON, default=dict)
    quality_metadata = Column(JSON, default=dict)
    embedding = Column(VectorType, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_indexed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
