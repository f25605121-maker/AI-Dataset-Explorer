import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text
from backend.app.db.session import Base


class PaperDataset(Base):
    __tablename__ = "paper_dataset"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(64), nullable=False, index=True)
    dataset_id = Column(String(64), nullable=False, index=True)
    relationship_type = Column(String(64), nullable=False, default="EVALUATES_ON")  # INTRODUCES, EVALUATES_ON, USES, BENCHMARKS
    confidence = Column(Float, default=1.0)
    evidence_source = Column(Text, nullable=True)
    source_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class PaperModel(Base):
    __tablename__ = "paper_model"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    paper_id = Column(String(64), nullable=False, index=True)
    model_id = Column(String(64), nullable=False, index=True)
    relationship_type = Column(String(64), nullable=False, default="EVALUATES")  # INTRODUCES, EVALUATES, EXTENDS, USES
    confidence = Column(Float, default=1.0)
    evidence_source = Column(Text, nullable=True)
    source_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class DatasetModel(Base):
    __tablename__ = "dataset_model"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(64), nullable=False, index=True)
    model_id = Column(String(64), nullable=False, index=True)
    compatibility_score = Column(Float, default=0.9)
    benchmark_score = Column(Float, nullable=True)
    evidence_source = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
