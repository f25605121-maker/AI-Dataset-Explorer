import uuid
from sqlalchemy import Column, String, Text, DateTime, JSON
from backend.app.db.session import Base
from backend.app.models.types import VectorType, utcnow


class PretrainedModel(Base):
    __tablename__ = "models"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, index=True)
    source = Column(String(64), nullable=False, default="huggingface", index=True)
    source_id = Column(String(255), nullable=True, index=True)
    canonical_url = Column(String(512), nullable=True)
    description = Column(Text, nullable=True)
    architecture = Column(String(255), nullable=True)
    tasks = Column(JSON, default=list)
    domains = Column(JSON, default=list)
    modalities = Column(JSON, default=list)
    parameters = Column(String(64), nullable=True)
    model_size = Column(String(64), nullable=True)
    memory_requirement = Column(JSON, default=dict)  # {"min_vram_gb": 8, "recommended_vram_gb": 16}
    inference_information = Column(JSON, default=dict)  # {"latency_ms": 45, "recommended_batch_size": 1}
    framework = Column(String(64), nullable=True)
    license = Column(String(128), nullable=True)
    benchmark_data = Column(JSON, default=dict)
    dataset_ids = Column(JSON, default=list)
    paper_ids = Column(JSON, default=list)
    embedding = Column(VectorType, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    last_indexed_at = Column(DateTime, default=utcnow)
