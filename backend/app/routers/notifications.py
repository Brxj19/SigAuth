"""In-app notifications router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.schemas.notification import (
    NotificationClearResponse,
    NotificationListResponse,
    NotificationReadAllResponse,
    NotificationResponse,
)
from app.services.notification_service import (
    clear_user_notifications,
    delete_notification,
    list_user_notifications,
    mark_all_notifications_read,
    mark_notification_read,
)

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications_endpoint(
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List current user's in-app notifications."""
    notifications, unread_count = await list_user_notifications(
        db=db,
        user_id=current_user["user_id"],
        limit=limit,
        unread_only=unread_only,
    )
    return NotificationListResponse(
        data=[NotificationResponse.model_validate(item) for item in notifications],
        unread_count=unread_count,
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read_endpoint(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark one notification as read."""
    notification = await mark_notification_read(
        db=db,
        user_id=current_user["user_id"],
        notification_id=notification_id,
    )
    if notification is None:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Notification not found"})
    return NotificationResponse.model_validate(notification)


@router.patch("/read-all", response_model=NotificationReadAllResponse)
async def mark_all_notifications_read_endpoint(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread notifications as read."""
    updated_count = await mark_all_notifications_read(db=db, user_id=current_user["user_id"])
    return NotificationReadAllResponse(
        message="All notifications marked as read",
        updated=updated_count,
        unread_count=0,
    )


@router.delete("/{notification_id}", response_model=NotificationClearResponse)
async def delete_notification_endpoint(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single notification for current user."""
    deleted = await delete_notification(
        db=db,
        user_id=current_user["user_id"],
        notification_id=notification_id,
    )
    if not deleted:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Notification not found"})
    _, unread_count = await list_user_notifications(
        db=db,
        user_id=current_user["user_id"],
        limit=1,
        unread_only=False,
    )
    return NotificationClearResponse(message="Notification cleared", deleted=1, unread_count=unread_count)


@router.delete("", response_model=NotificationClearResponse)
async def clear_notifications_endpoint(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all notifications for current user."""
    deleted_count = await clear_user_notifications(db=db, user_id=current_user["user_id"])
    return NotificationClearResponse(
        message="All notifications cleared",
        deleted=deleted_count,
        unread_count=0,
    )
