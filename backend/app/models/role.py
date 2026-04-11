"""Role model with permissions array."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, Boolean, DateTime, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    permissions = Column(ARRAY(Text), nullable=False, default=list)
    is_system = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Unique constraint on (org_id, name) added via migration

    # Relationships
    organization = relationship("Organization", back_populates="roles")
    group_roles = relationship("GroupRole", back_populates="role", lazy="selectin")
