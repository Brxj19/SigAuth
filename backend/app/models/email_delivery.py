"""Email delivery queue and tracking model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, Integer, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class EmailDelivery(Base):
    __tablename__ = "email_deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    event_key = Column(Text, nullable=False)
    to_email = Column(Text, nullable=False)
    subject = Column(Text, nullable=False)
    html_body = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="pending")  # pending | sent | failed | dead
    attempt_count = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    provider_message_id = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_email_deliveries_status_retry", "status", "next_retry_at"),
        Index("idx_email_deliveries_user", "user_id"),
        Index("idx_email_deliveries_org", "org_id"),
    )
