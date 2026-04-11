"""add_application_group_assignments

Revision ID: 7f3c2b1a9d4e
Revises: 5788c5bc2e70
Create Date: 2026-04-08 12:30:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "7f3c2b1a9d4e"
down_revision = "5788c5bc2e70"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "application_group_assignments",
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "group_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("groups.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("application_group_assignments")
