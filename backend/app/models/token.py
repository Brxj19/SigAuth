"""Token model for ID, Access, and Refresh tokens."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, Boolean, DateTime, ForeignKey, ARRAY, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Token(Base):
    __tablename__ = "tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    jti = Column(Text, nullable=False, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    client_id = Column(Text, nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    token_type = Column(Text, nullable=False, default="id")  # 'id' | 'access' | 'refresh'
    scopes = Column(ARRAY(Text), nullable=False, default=list)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, nullable=False, default=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoke_reason = Column(Text, nullable=True)
    issued_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="tokens")

    __table_args__ = (
        Index("idx_tokens_user", "user_id"),
        Index("idx_tokens_client", "client_id"),
        Index("idx_tokens_jti", "jti"),
    )
