"""add application role mappings

Revision ID: c3f9e1b7a2d4
Revises: a9210f9c4d12
Create Date: 2026-04-09 12:05:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "c3f9e1b7a2d4"
down_revision = "a9210f9c4d12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "application_role_mappings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source_type", sa.Text(), nullable=False),
        sa.Column("source_value", sa.Text(), nullable=False),
        sa.Column("app_role", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("source_type IN ('group', 'role')", name="ck_application_role_mappings_source_type"),
        sa.UniqueConstraint(
            "application_id",
            "source_type",
            "source_value",
            "app_role",
            name="uq_application_role_mapping",
        ),
    )
    op.create_index(
        "idx_app_role_mappings_application_id",
        "application_role_mappings",
        ["application_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_app_role_mappings_application_id", table_name="application_role_mappings")
    op.drop_table("application_role_mappings")
