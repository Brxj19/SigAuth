"""Branded HTML email templates."""

from datetime import datetime, timezone


def _layout(title: str, body_html: str) -> str:
    year = datetime.now(timezone.utc).year
    return f"""
    <html>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="background:#1d4ed8;color:#ffffff;padding:18px 24px;font-size:18px;font-weight:700;">
                  Identity Admin
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <h2 style="margin:0 0 12px 0;font-size:22px;color:#0f172a;">{title}</h2>
                  {body_html}
                </td>
              </tr>
              <tr>
                <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                  Internal Identity Platform · {year}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


def verification_email_html(verify_url: str) -> str:
    return _layout(
        "Verify your email",
        f"""
        <p style="margin:0 0 12px 0;">Please verify your email address to complete account activation.</p>
        <p style="margin:0 0 16px 0;">
          <a href="{verify_url}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">Verify Email</a>
        </p>
        <p style="margin:0;font-size:13px;color:#64748b;">This link expires in 24 hours.</p>
        """,
    )


def password_reset_email_html(reset_url: str) -> str:
    return _layout(
        "Reset your password",
        f"""
        <p style="margin:0 0 12px 0;">We received a password reset request for your account.</p>
        <p style="margin:0 0 16px 0;">
          <a href="{reset_url}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">Reset Password</a>
        </p>
        <p style="margin:0;font-size:13px;color:#64748b;">This link expires in 1 hour.</p>
        """,
    )


def invitation_email_html(setup_url: str, expiry_hours: int) -> str:
    return _layout(
        "You have been invited",
        f"""
        <p style="margin:0 0 12px 0;">An administrator created an Identity Admin account for you.</p>
        <p style="margin:0 0 12px 0;">Complete your account setup and create your password using the link below.</p>
        <p style="margin:0 0 16px 0;">
          <a href="{setup_url}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">Set Up Account</a>
        </p>
        <p style="margin:0;font-size:13px;color:#64748b;">This invitation expires in {expiry_hours} hours.</p>
        """,
    )


def account_notification_html(title: str, message: str) -> str:
    return _layout(
        title,
        f"""
        <p style="margin:0 0 12px 0;">{message}</p>
        <p style="margin:0;font-size:13px;color:#64748b;">If this activity was unexpected, contact your administrator.</p>
        """,
    )


def weekly_summary_email_html(user_name: str, period_label: str, items: list[dict[str, int | str]], unread_count: int) -> str:
    rows = "".join(
        f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;">{item['label']}</td>
          <td align="right" style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:700;">{item['count']}</td>
        </tr>
        """
        for item in items
    )

    return _layout(
        "Your weekly Mini Okta summary",
        f"""
        <p style="margin:0 0 12px 0;">Hello {user_name}, here is your activity summary for <strong>{period_label}</strong>.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px 0;">
          {rows}
        </table>
        <p style="margin:0 0 10px 0;">Unread notifications still waiting in your inbox: <strong>{unread_count}</strong></p>
        <p style="margin:0;font-size:13px;color:#64748b;">You are receiving this because weekly summary emails are enabled in your account settings.</p>
        """,
    )
