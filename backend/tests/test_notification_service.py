import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.services import notification_service


class FakeResult:
    def __init__(self, scalar_one_or_none=None, scalar=None, all_rows=None):
        self._scalar_one_or_none = scalar_one_or_none
        self._scalar = scalar
        self._all_rows = all_rows or []

    def scalar_one_or_none(self):
        return self._scalar_one_or_none

    def scalar(self):
        return self._scalar

    def all(self):
        return list(self._all_rows)


class NotificationServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_send_notification_event_skips_when_preference_disabled(self):
        db = SimpleNamespace(execute=AsyncMock(return_value=FakeResult(scalar_one_or_none=SimpleNamespace(enabled=False))))
        user = SimpleNamespace(id=uuid4(), org_id=uuid4(), email="user@example.com")

        with patch.object(notification_service, "create_in_app_notification", AsyncMock()) as create_mock, \
             patch.object(notification_service, "queue_email", AsyncMock()) as queue_mock, \
             patch.object(notification_service, "process_email_queue", AsyncMock()) as process_mock:
            sent = await notification_service.send_notification_event(
                db=db,
                user=user,
                event_key="security.password_reset",
                title="Password reset completed",
                message="Done.",
            )

        self.assertFalse(sent)
        create_mock.assert_not_called()
        queue_mock.assert_not_called()
        process_mock.assert_not_called()

    async def test_custom_admin_event_uses_admin_activity_preference_fallback(self):
        db = SimpleNamespace(execute=AsyncMock(return_value=FakeResult(scalar_one_or_none=None)))
        recipient = SimpleNamespace(id=uuid4(), org_id=uuid4(), email="admin@example.com")

        with patch.object(notification_service, "list_admin_recipients", AsyncMock(return_value=[recipient])), \
             patch.object(notification_service, "create_in_app_notification", AsyncMock()) as create_mock, \
             patch.object(notification_service, "queue_email", AsyncMock()) as queue_mock, \
             patch.object(notification_service, "process_email_queue", AsyncMock()) as process_mock:
            delivered = await notification_service.send_admin_activity_notification(
                db=db,
                org_id=recipient.org_id,
                title="Checkout started",
                message="An org admin started checkout.",
                event_key="org.billing.checkout.started",
            )

        self.assertEqual(delivered, 1)
        create_mock.assert_awaited_once()
        queue_mock.assert_awaited_once()
        process_mock.assert_awaited_once()

    async def test_weekly_summary_email_queues_digest(self):
        user = SimpleNamespace(
            id=uuid4(),
            org_id=uuid4(),
            email="summary@example.com",
            first_name="Mini",
            last_name="Okta",
        )
        db = SimpleNamespace(
            execute=AsyncMock(
                side_effect=[
                    FakeResult(scalar_one_or_none=None),
                    FakeResult(all_rows=[("security.login_failure", 3), ("admin.activity", 2)]),
                    FakeResult(scalar=4),
                ]
            )
        )

        with patch.object(notification_service, "is_notification_enabled", AsyncMock(return_value=True)), \
             patch.object(notification_service, "queue_email", AsyncMock()) as queue_mock, \
             patch.object(notification_service, "process_email_queue", AsyncMock()) as process_mock:
            sent = await notification_service.send_weekly_summary_email(db=db, user=user)

        self.assertTrue(sent)
        queue_mock.assert_awaited_once()
        process_mock.assert_awaited_once()
        kwargs = queue_mock.await_args.kwargs
        self.assertEqual(kwargs["event_key"], notification_service.WEEKLY_SUMMARY_EVENT)
        self.assertIn("weekly summary", kwargs["subject"].lower())


if __name__ == "__main__":
    unittest.main()
