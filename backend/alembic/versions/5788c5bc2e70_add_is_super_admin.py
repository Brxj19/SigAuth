# Alembic script.py.mako template
"""add_is_super_admin

Revision ID: 5788c5bc2e70
Revises: 001_initial_schema
Create Date: 2026-04-07 18:10:44.519992
"""
import os

from alembic import op
import sqlalchemy as sa


revision = '5788c5bc2e70'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_super_admin", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    admin_email = os.getenv("ADMIN_EMAIL")
    if admin_email:
        op.get_bind().execute(
            sa.text("UPDATE users SET is_super_admin = true WHERE email = :email"),
            {"email": admin_email},
        )
    op.alter_column("users", "is_super_admin", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "is_super_admin")
