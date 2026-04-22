"""add password_reset_required to users

Revision ID: f6c1a9e2b4d8
Revises: e4a1b9c3d7f2
Create Date: 2026-04-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f6c1a9e2b4d8"
down_revision = "e4a1b9c3d7f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_reset_required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.alter_column("users", "password_reset_required", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "password_reset_required")
