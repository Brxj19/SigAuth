"""add MFA recovery code fields

Revision ID: e8b7c1a2f9d4
Revises: d4f1c8a2e981
Create Date: 2026-04-11 19:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "e8b7c1a2f9d4"
down_revision = "d4f1c8a2e981"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("mfa_recovery_codes", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("mfa_recovery_codes_generated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "mfa_recovery_codes_generated_at")
    op.drop_column("users", "mfa_recovery_codes")
