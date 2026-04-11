"""Audit Log model — append-only."""

from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, Text, DateTime, ForeignKey, JSON, Index
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    actor_id = Column(UUID(as_uuid=True), nullable=True)
    actor_type = Column(Text, nullable=True)  # user | service | system
    event_type = Column(Text, nullable=False)
    resource_type = Column(Text, nullable=True)
    resource_id = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_audit_org", "org_id"),
        Index("idx_audit_event", "event_type"),
        Index("idx_audit_time", "created_at"),
    )
