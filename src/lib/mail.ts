import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "litworks.media@gmail.com",
    pass: process.env.SMTP_PASS || "",
  },
});

export async function sendOTPEmail(email: string, otp: string, requestUserEmail?: string) {
  const mailOptions = {
    from: `"LITWORKS Operations" <${process.env.SMTP_USER || "litworks.media@gmail.com"}>`,
    to: email,
    subject: `🔑 ${otp} is the Admin Passcode Reset Key`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>LITWORKS Admin Reset</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #000000;
            color: #ffffff;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background-color: #0a0a0a;
            border: 1px solid #222222;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
          }
          .logo {
            font-weight: 900;
            font-size: 28px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 24px;
            color: #ffffff;
          }
          .orange {
            color: #FF7A00;
          }
          h2 {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #ffffff;
          }
          p {
            font-size: 14px;
            color: #a0a0a0;
            line-height: 1.6;
            margin-bottom: 32px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 6px;
            color: #FF7A00;
            background-color: #121212;
            border: 1px dashed #FF7A00;
            border-radius: 16px;
            padding: 20px;
            margin: 0 auto 32px;
            width: fit-content;
          }
          .footer {
            font-size: 11px;
            color: #555555;
            border-top: 1px solid #1a1a1a;
            padding-top: 24px;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">LIT<span class="orange">WORKS</span></div>
          <h2>Access Key Request</h2>
          <p>Hello,<br>We received a passcode reset request for the account: <strong>${requestUserEmail || "Unknown"}</strong> on the LITWORKS Admin Terminal. Use the secure access code below to complete the reset:</p>
          <div class="otp-code">${otp}</div>
          <p style="font-size: 12px; margin-bottom: 0;">This passcode is valid for <strong>10 minutes</strong>. If you did not request this, please secure your account credentials immediately.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} LITWORKS. Media & Production Enterprise.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}
