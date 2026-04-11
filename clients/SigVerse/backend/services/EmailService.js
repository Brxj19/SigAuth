const nodemailer = require('nodemailer');

let cachedTransporter = null;
let warnedMissingConfig = false;

function buildTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '0', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn('[EmailService] SMTP is not configured. OTP emails will be logged to the backend console instead of being sent.');
    }
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  return cachedTransporter;
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = buildTransporter();
  if (!transporter) {
    // Fallback for dev environments where SMTP isn't configured.
    console.log(`[EmailService] Email to ${to} (${subject})`);
    console.log(text || html || '');
    return { delivered: false, preview: true };
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
}

async function sendOtpEmail(email, otpCode, purpose) {
  const purposeLabel = {
    signup: 'Sign up verification',
    login: 'Login verification',
    reset: 'Password reset'
  }[purpose] || 'Verification';

  const text = `Your ${purposeLabel} OTP is ${otpCode}. It expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">${purposeLabel}</h2>
      <p style="margin: 0 0 12px;">Use the OTP below to continue:</p>
      <div style="font-size: 24px; font-weight: 700; letter-spacing: 4px; background: #f3f4f6; padding: 12px 18px; display: inline-block; border-radius: 8px;">
        ${otpCode}
      </div>
      <p style="margin: 16px 0 0;">This code expires in ${process.env.OTP_TTL_MINUTES || 10} minutes.</p>
    </div>
  `;

  return sendEmail({ to: email, subject: `${purposeLabel} OTP`, text, html });
}

async function sendWelcomeEmail(email, { name, role, tempPassword }) {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const text = [
    `Welcome to SigVerse, ${name}!`,
    '',
    `Your account has been created by an administrator.`,
    '',
    `Account Details:`,
    `  Name: ${name}`,
    `  Email: ${email}`,
    `  Role: ${roleLabel}`,
    '',
    `Your temporary password: ${tempPassword}`,
    '',
    `Please log in at ${loginUrl} and immediately reset your password using the "Forgot Password" link on the login page.`,
    '',
    '— The SigVerse Team'
  ].join('\n');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 28px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700;">Welcome to SigVerse</h1>
      </div>
      <div style="background: #ffffff; padding: 28px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px;">Hi <strong>${name}</strong>,</p>
        <p style="margin: 0 0 16px;">Your account has been created by an administrator. Here are your details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px;">
          <tr><td style="padding: 8px 12px; background: #f9fafb; font-weight: 600; width: 40%; border-radius: 6px 0 0 0;">Name</td><td style="padding: 8px 12px; background: #f9fafb; border-radius: 0 6px 0 0;">${name}</td></tr>
          <tr><td style="padding: 8px 12px; font-weight: 600;">Email</td><td style="padding: 8px 12px;">${email}</td></tr>
          <tr><td style="padding: 8px 12px; background: #f9fafb; font-weight: 600;">Role</td><td style="padding: 8px 12px; background: #f9fafb;">${roleLabel}</td></tr>
        </table>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 0 0 20px;">
          <p style="margin: 0 0 6px; font-weight: 700; color: #92400e;">Your Temporary Password</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px; color: #1f2937; font-family: monospace;">${tempPassword}</p>
        </div>
        <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 0 0 20px;">
          <p style="margin: 0 0 8px; font-weight: 700; color: #1e40af;">⚠️ Important — Reset Your Password</p>
          <ol style="margin: 0; padding-left: 18px; color: #1e3a5f;">
            <li>Go to the <a href="${loginUrl}" style="color: #6366f1; text-decoration: underline;">SigVerse login page</a></li>
            <li>Click <strong>"Forgot Password"</strong></li>
            <li>Enter your email to receive an OTP</li>
            <li>Verify the OTP and set a new secure password</li>
          </ol>
        </div>
        <p style="margin: 0; font-size: 13px; color: #6b7280;">If you did not expect this email, please contact your administrator.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject: 'Welcome to SigVerse — Your Account Has Been Created', text, html });
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail
};
