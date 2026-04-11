import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.services import email_service


class EmailServiceTests(unittest.IsolatedAsyncioTestCase):
    async def test_send_password_reset_email_queues_expected_message(self):
        db = SimpleNamespace()
        user_id = uuid4()

        with patch.object(email_service, "queue_email", AsyncMock()) as queue_mock, \
             patch.object(email_service, "process_email_queue", AsyncMock()) as process_mock:
            await email_service.send_password_reset_email(
                db=db,
                email="reset@example.com",
                reset_token="reset-token-123",
                org_id=uuid4(),
                user_id=user_id,
            )

        queue_kwargs = queue_mock.await_args.kwargs
        self.assertEqual(queue_kwargs["event_key"], "security.password_reset")
        self.assertIn("password-reset/confirm?token=reset-token-123", queue_kwargs["html_body"])
        process_mock.assert_awaited_once()

    async def test_send_invitation_email_queues_account_created_event(self):
        db = SimpleNamespace()

        with patch.object(email_service, "queue_email", AsyncMock()) as queue_mock, \
             patch.object(email_service, "process_email_queue", AsyncMock()) as process_mock:
            await email_service.send_invitation_email(
                db=db,
                email="invite@example.com",
                setup_token="setup-token-123",
                org_id=uuid4(),
                user_id=uuid4(),
            )

        queue_kwargs = queue_mock.await_args.kwargs
        self.assertEqual(queue_kwargs["event_key"], "account.created")
        self.assertIn("setup-password?token=setup-token-123", queue_kwargs["html_body"])
        process_mock.assert_awaited_once()

    async def test_send_verification_email_queues_verification_event(self):
        db = SimpleNamespace()
        user_id = str(uuid4())

        with patch.object(email_service, "queue_email", AsyncMock()) as queue_mock, \
             patch.object(email_service, "process_email_queue", AsyncMock()) as process_mock:
            await email_service.send_verification_email(
                db=db,
                user_id=user_id,
                email="verify@example.com",
                org_id=uuid4(),
            )

        queue_kwargs = queue_mock.await_args.kwargs
        self.assertEqual(queue_kwargs["event_key"], "security.email_verification")
        self.assertIn("verify-email?token=", queue_kwargs["html_body"])
        process_mock.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
