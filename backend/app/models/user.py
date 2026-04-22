"""User model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    email = Column(Text, nullable=False)
    password_hash = Column(Text, nullable=False)
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    profile_image_url = Column(Text, nullable=True)
    status = Column(Text, nullable=False, default="active")  # active | locked | suspended
    email_verified = Column(Boolean, nullable=False, default=False)
    is_super_admin = Column(Boolean, nullable=False, default=False)
    must_change_password = Column(Boolean, nullable=False, default=False)
    password_reset_required = Column(Boolean, nullable=False, default=False)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    password_expires_at = Column(DateTime(timezone=True), nullable=True)
    invited_at = Column(DateTime(timezone=True), nullable=True)
    invitation_expires_at = Column(DateTime(timezone=True), nullable=True)
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret = Column(Text, nullable=True)
    mfa_recovery_codes = Column(Text, nullable=True)
    mfa_recovery_codes_generated_at = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        {"schema": None},
    )

    # Unique constraint on (org_id, email) added via migration

    # Relationships
    organization = relationship("Organization", back_populates="users")
    group_memberships = relationship("GroupMember", back_populates="user", lazy="selectin")
    tokens = relationship("Token", back_populates="user", lazy="selectin")
