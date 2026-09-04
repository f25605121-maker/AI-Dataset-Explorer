import uuid
from sqlalchemy import Column, String, Float, DateTime
from backend.app.db.session import Base
from backend.app.models.types import utcnow


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(64), nullable=True, index=True)
    model_id = Column(String(64), nullable=True, index=True)
    paper_id = Column(String(64), nullable=True, index=True)
    task = Column(String(128), nullable=False, index=True)
    metric = Column(String(64), nullable=False)  # e.g., "Dice", "mAP@50", "Top-1 Acc", "WER"
    score = Column(Float, nullable=False)
    split = Column(String(64), nullable=True, default="test")
    hardware = Column(String(128), nullable=True)  # e.g., "1x RTX 3090", "A100-80GB"
    source = Column(String(128), nullable=True)  # e.g., "PapersWithCode", "Official Paper"
    source_url = Column(String(512), nullable=True)
    reported_date = Column(DateTime, default=utcnow)
