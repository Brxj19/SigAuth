"""Authorization Code model for OIDC Authorization Code flow."""

from datetime import datetime, timezone
from sqlalchemy import Column, Text, DateTime, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AuthorizationCode(Base):
    __tablename__ = "authorization_codes"

    code = Column(Text, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    client_id = Column(Text, nullable=False)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    redirect_uri = Column(Text, nullable=False)
    scopes = Column(ARRAY(Text), nullable=False, default=list)
    code_challenge = Column(Text, nullable=True)  # PKCE S256 value
    nonce = Column(Text, nullable=True)  # OIDC nonce
    expires_at = Column(DateTime(timezone=True), nullable=False)  # now() + 10 minutes
    used_at = Column(DateTime(timezone=True), nullable=True)  # set on exchange; prevents replay
