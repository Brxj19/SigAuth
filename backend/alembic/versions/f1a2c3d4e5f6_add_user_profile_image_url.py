"""add user profile image url

Revision ID: f1a2c3d4e5f6
Revises: e8b7c1a2f9d4
Create Date: 2026-04-15 13:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "f1a2c3d4e5f6"
down_revision = "e8b7c1a2f9d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_image_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_image_url")
