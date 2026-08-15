const { sendEmail } = require("./lib/email");
require("dotenv").config();

async function runDiagnostic() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || emailUser || "azrielstudio45@gmail.com";

  console.log("=========================================");
  console.log(" Velour Email Notification Diagnostic");
  console.log("=========================================");
  console.log(`Recipient (ADMIN_NOTIFICATION_EMAIL): ${to}`);
  console.log(`Resend API Key: ${resendApiKey ? "CONFIGURED (" + resendApiKey.substring(0, 6) + "...)" : "NOT SET"}`);
  console.log(`Gmail User / SMTP: ${emailUser ? emailUser : "NOT SET"}`);
  console.log(`Gmail App Password: ${emailPass ? "CONFIGURED" : "NOT SET"}`);
  console.log("=========================================\n");

  if (!resendApiKey && (!emailUser || !emailPass)) {
    console.error("❌ No email provider is configured in server/.env");
    console.log("👉 Recommended Quick Fix (Takes 1 min, no password needed):");
    console.log("   1. Sign up for free at https://resend.com");
    console.log("   2. Copy your API Key (starts with re_)");
    console.log("   3. Add RESEND_API_KEY=re_xxxx to server/.env");
    console.log("   4. Run this test again: node test-email.js\n");
    process.exit(1);
  }

  console.log(`⏳ Sending a test email to ${to}...`);

  try {
    const result = await sendEmail({
      to,
      subject: "✨ Velour Hairs: Email Notifications Active!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #FAF8F5; padding: 24px; border-radius: 12px; border: 1px solid #E6DED6;">
          <h2 style="color: #9E4759; margin-top: 0;">VELOUR HAIRS & BEAUTY</h2>
          <p style="font-size: 16px; color: #231815;"><strong>🎉 Success! Your email notifications are working.</strong></p>
          <p style="color: #73645B; font-size: 14px; line-height: 1.6;">
            Whenever a customer books an appointment or places an order on your website, you will receive real-time automated alerts right here at <strong>${to}</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #E6DED6; margin: 20px 0;" />
          <p style="font-size: 12px; color: #8C7B70; margin: 0;">
            Sent via Velour Notification Engine (${result.provider.toUpperCase()})
          </p>
        </div>
      `,
      fromName: "Velour Hairs System",
    });

    if (result.success) {
      console.log(`\n🎉 Success! Test email sent via [${result.provider.toUpperCase()}]!`);
      console.log(`📬 Check your inbox at ${to}`);
    } else {
      console.log("\n⚠️ Email was skipped. Check your configuration.");
    }
  } catch (err) {
    console.error("\n❌ Failed to send email:", err.message);
  }
}

runDiagnostic();
