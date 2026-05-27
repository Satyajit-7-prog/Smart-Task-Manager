import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def send_otp_email(email: str, otp: str):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Fallback to local console printing if SMTP is not configured
        print(f"\n========================================\n[DEV MAIL] OTP for {email} is: {otp}\n========================================\n")
        logger.info(f"[DEV MAIL] OTP for {email} is: {otp}")
        return

    sender = settings.SMTP_SENDER or settings.SMTP_USER
    current_year = datetime.datetime.utcnow().year

    message = MIMEMultipart("alternative")
    message["Subject"] = f"{otp} is your Smart Task Manager verification code"
    message["From"] = sender
    message["To"] = email

    text = f"Your Smart Task Manager verification code is {otp}. This code is valid for 5 minutes."
    html = f"""\
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
        }}
        .container {{
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }}
        .header {{
          background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%);
          padding: 40px 20px;
          text-align: center;
        }}
        .logo {{
          font-size: 28px;
          font-weight: bold;
          color: #ffffff;
          letter-spacing: -0.5px;
        }}
        .content {{
          padding: 40px 30px;
          color: #1f2937;
          line-height: 1.6;
        }}
        .title {{
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 20px;
        }}
        .otp-container {{
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin: 30px 0;
        }}
        .otp-code {{
          font-size: 36px;
          font-weight: 800;
          color: #06b6d4;
          letter-spacing: 6px;
          margin: 0;
        }}
        .info-text {{
          font-size: 14px;
          color: #6b7280;
        }}
        .footer {{
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Smart Task Manager</div>
        </div>
        <div class="content">
          <div class="title">Verify Your Email Address</div>
          <p>Thank you for signing up for Smart Task Manager! To complete your registration, please use the following One-Time Password (OTP) to verify your email address:</p>
          <div class="otp-container">
            <h1 class="otp-code">{otp}</h1>
            <p class="info-text" style="margin-top: 12px; margin-bottom: 0;">This code is valid for 5 minutes and can only be used once.</p>
          </div>
          <p>If you did not request this code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; {current_year} Smart Task Manager. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(sender, email, message.as_string())
        server.quit()
        logger.info(f"OTP email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        print(f"\n========================================\n[SMTP FAIL FALLBACK] OTP for {email} is: {otp}\n========================================\n")
        raise e


def send_password_reset_email(email: str, otp: str):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Fallback to local console printing if SMTP is not configured
        print(f"\n========================================\n[DEV PASSWORD RESET MAIL] OTP for {email} is: {otp}\n========================================\n")
        logger.info(f"[DEV PASSWORD RESET MAIL] OTP for {email} is: {otp}")
        return

    sender = settings.SMTP_SENDER or settings.SMTP_USER
    current_year = datetime.datetime.utcnow().year

    message = MIMEMultipart("alternative")
    message["Subject"] = f"{otp} is your Smart Task Manager password reset code"
    message["From"] = sender
    message["To"] = email

    text = f"Your Smart Task Manager password reset code is {otp}. This code is valid for 5 minutes."
    html = f"""\
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
        }}
        .container {{
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }}
        .header {{
          background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
          padding: 40px 20px;
          text-align: center;
        }}
        .logo {{
          font-size: 28px;
          font-weight: bold;
          color: #ffffff;
          letter-spacing: -0.5px;
        }}
        .content {{
          padding: 40px 30px;
          color: #1f2937;
          line-height: 1.6;
        }}
        .title {{
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 20px;
        }}
        .otp-container {{
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin: 30px 0;
        }}
        .otp-code {{
          font-size: 36px;
          font-weight: 800;
          color: #ec4899;
          letter-spacing: 6px;
          margin: 0;
        }}
        .info-text {{
          font-size: 14px;
          color: #6b7280;
        }}
        .footer {{
          background-color: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid #e5e7eb;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Smart Task Manager</div>
        </div>
        <div class="content">
          <div class="title">Reset Your Password</div>
          <p>We received a request to reset the password for your Smart Task Manager account. To complete this request, please use the following One-Time Password (OTP):</p>
          <div class="otp-container">
            <h1 class="otp-code">{otp}</h1>
            <p class="info-text" style="margin-top: 12px; margin-bottom: 0;">This code is valid for 5 minutes and can only be used once.</p>
          </div>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; {current_year} Smart Task Manager. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(sender, email, message.as_string())
        server.quit()
        logger.info(f"Password reset email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        print(f"\n========================================\n[SMTP PASSWORD RESET FAIL FALLBACK] OTP for {email} is: {otp}\n========================================\n")
        raise e

