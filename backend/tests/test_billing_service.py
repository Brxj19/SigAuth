import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

from app.services.billing_service import (
    LEGACY_ENTERPRISE_PLAN_CODE,
    apply_successful_plan_payment,
    build_plan_status_payload,
    ensure_billing_state,
    reconcile_subscription_status,
)


class BillingServiceTests(unittest.TestCase):
    def test_verified_org_defaults_to_admin_provisioned_plan(self):
        settings = {
            "access_tier": "verified_enterprise",
            "verification_status": "approved",
        }

        normalized = ensure_billing_state(settings)

        self.assertEqual(normalized["billing"]["current_plan_code"], LEGACY_ENTERPRISE_PLAN_CODE)
        self.assertEqual(normalized["billing"]["subscription"]["plan_name"], "Admin Provisioned")
        self.assertTrue(normalized["billing"]["subscription"]["managed_manually"])

    def test_successful_plan_payment_promotes_org_and_sets_limits(self):
        settings = {
            "access_tier": "limited",
            "verification_status": "pending",
            "limits": {"max_users": 5, "max_apps": 2},
        }

        updated = apply_successful_plan_payment(
            settings,
            plan_code="plus",
            payment_record={
                "payment_id": "demo_pay_123",
                "provider": "demo",
                "amount_paise": 300,
                "currency": "INR",
                "payment_method": "upi",
                "paid_at": datetime.now(timezone.utc).isoformat(),
            },
        )

        self.assertEqual(updated["access_tier"], "verified_enterprise")
        self.assertEqual(updated["verification_status"], "approved")
        self.assertEqual(updated["billing"]["current_plan_code"], "plus")
        self.assertEqual(updated["billing"]["subscription"]["status"], "active")
        self.assertEqual(updated["limits"], {"max_users": 100, "max_apps": 30})
        self.assertEqual(updated["billing"]["payments"][-1]["plan_code"], "plus")

    def test_expired_paid_subscription_reverts_to_free_tier(self):
        now = datetime.now(timezone.utc)
        settings = {
            "access_tier": "verified_enterprise",
            "verification_status": "approved",
            "limits": {"max_users": 25, "max_apps": 10},
            "billing": {
                "current_plan_code": "go",
                "subscription": {
                    "plan_code": "go",
                    "plan_name": "Go",
                    "status": "active",
                    "managed_manually": False,
                    "cancel_at_period_end": False,
                    "current_period_start": (now - timedelta(days=40)).isoformat(),
                    "current_period_end": (now - timedelta(days=5)).isoformat(),
                },
                "payments": [],
            },
        }

        updated, changed = reconcile_subscription_status(settings)

        self.assertTrue(changed)
        self.assertEqual(updated["access_tier"], "limited")
        self.assertEqual(updated["verification_status"], "payment_due")
        self.assertEqual(updated["billing"]["current_plan_code"], "free")
        self.assertEqual(updated["billing"]["subscription"]["status"], "expired")

    def test_plan_status_payload_exposes_catalog_and_current_plan(self):
        org = SimpleNamespace(
            id=uuid4(),
            name="Acme",
            display_name="Acme Corp",
            slug="acme",
            settings={"access_tier": "verified_enterprise", "verification_status": "approved"},
        )

        payload = build_plan_status_payload(org)

        self.assertEqual(payload["current_plan_code"], LEGACY_ENTERPRISE_PLAN_CODE)
        self.assertEqual(payload["current_plan"]["name"], "Admin Provisioned")
        self.assertEqual([item["code"] for item in payload["available_plans"]], ["free", "go", "plus", "pro"])


if __name__ == "__main__":
    unittest.main()
