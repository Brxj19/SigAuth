"""Organization model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False, unique=True)
    slug = Column(Text, nullable=False, unique=True)
    display_name = Column(Text, nullable=True)
    status = Column(Text, nullable=False, default="active")  # active | suspended | deleted
    settings = Column(JSON, default=dict)  # allow_social_login, enforce_mfa, session_lifetime_seconds, require_email_verification
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    users = relationship("User", back_populates="organization", lazy="selectin")
    applications = relationship("Application", back_populates="organization", lazy="selectin")
    roles = relationship("Role", back_populates="organization", lazy="selectin")
    groups = relationship("Group", back_populates="organization", lazy="selectin")
