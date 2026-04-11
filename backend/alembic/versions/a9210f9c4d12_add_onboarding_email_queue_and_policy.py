"""add onboarding/email queue/password policy fields

Revision ID: a9210f9c4d12
Revises: 7f3c2b1a9d4e
Create Date: 2026-04-08 13:15:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "a9210f9c4d12"
down_revision = "7f3c2b1a9d4e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("must_change_password", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("password_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("invited_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("invitation_expires_at", sa.DateTime(timezone=True), nullable=True))

    op.add_column("password_reset_tokens", sa.Column("purpose", sa.Text(), nullable=False, server_default="reset"))
    op.add_column("password_reset_tokens", sa.Column("used_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "email_deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("event_key", sa.Text(), nullable=False),
        sa.Column("to_email", sa.Text(), nullable=False),
        sa.Column("subject", sa.Text(), nullable=False),
        sa.Column("html_body", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("provider_message_id", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_email_deliveries_status_retry", "email_deliveries", ["status", "next_retry_at"])
    op.create_index("idx_email_deliveries_user", "email_deliveries", ["user_id"])
    op.create_index("idx_email_deliveries_org", "email_deliveries", ["org_id"])

    op.create_table(
        "notification_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_key", sa.Text(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "event_key", name="uq_notification_preferences_user_event"),
    )


def downgrade() -> None:
    op.drop_table("notification_preferences")
    op.drop_index("idx_email_deliveries_org", table_name="email_deliveries")
    op.drop_index("idx_email_deliveries_user", table_name="email_deliveries")
    op.drop_index("idx_email_deliveries_status_retry", table_name="email_deliveries")
    op.drop_table("email_deliveries")

    op.drop_column("password_reset_tokens", "used_at")
    op.drop_column("password_reset_tokens", "purpose")

    op.drop_column("users", "invitation_expires_at")
    op.drop_column("users", "invited_at")
    op.drop_column("users", "password_expires_at")
    op.drop_column("users", "password_changed_at")
    op.drop_column("users", "must_change_password")
