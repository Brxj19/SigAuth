import unittest


class SmokeTests(unittest.TestCase):
    def test_core_modules_import(self):
        from app.services import billing_service, email_service, notification_service  # noqa: F401
        from app.routers import auth, organizations  # noqa: F401

        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()
