"""Application-specific source-to-role mapping model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class ApplicationRoleMapping(Base):
    __tablename__ = "application_role_mappings"
    __table_args__ = (
        UniqueConstraint(
            "application_id",
            "source_type",
            "source_value",
            "app_role",
            name="uq_application_role_mapping",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_type = Column(Text, nullable=False)  # group | role
    source_value = Column(Text, nullable=False)
    app_role = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    application = relationship("Application", back_populates="role_mappings")
