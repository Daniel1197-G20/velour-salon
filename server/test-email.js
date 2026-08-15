const { sendEmail } = require("./lib/email");
require("dotenv").config();

async function runDiagnostic() {
  const customTarget = process.argv[2];
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;
  const to = customTarget || process.env.ADMIN_NOTIFICATION_EMAIL || emailUser || "azrielstudio45@gmail.com";

  console.log("=========================================");
  console.log(" Velour Email Notification Diagnostic");
  console.log("=========================================");
  console.log(`Test Recipient: ${to} ${customTarget ? "(Custom recipient tested)" : "(Admin default)"}`);
  console.log(`Resend API Key: ${resendApiKey ? "CONFIGURED (" + resendApiKey.substring(0, 6) + "...)" : "NOT SET"}`);
  console.log(`Resend From Email: ${process.env.RESEND_FROM_EMAIL || "Velour Hairs <onboarding@resend.dev> (Sandbox default)"}`);
  console.log(`Gmail User / SMTP: ${emailUser ? emailUser : "NOT SET"}`);
  console.log(`Gmail App Password: ${emailPass ? "CONFIGURED" : "NOT SET"}`);
  console.log("=========================================\n");

  if (!resendApiKey && (!emailUser || !emailPass)) {
    console.error("❌ No email provider is configured in server/.env");
    console.log("👉 Recommended Options:");
    console.log("   Option 1: Add a verified domain on Resend (resend.com/domains) and set RESEND_FROM_EMAIL");
    console.log("   Option 2: Use Gmail SMTP by setting EMAIL_USER and EMAIL_APP_PASSWORD in server/.env\n");
    process.exit(1);
  }

  console.log(`⏳ Sending a test email to ${to}...`);

  try {
    const result = await sendEmail({
      to,
      subject: "✨ Velour Hairs: Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; background: #FAF8F5; padding: 24px; border-radius: 12px; border: 1px solid #E6DED6;">
          <h2 style="color: #9E4759; margin-top: 0;">VELOUR HAIRS & BEAUTY</h2>
          <p style="font-size: 16px; color: #231815;"><strong>🎉 Success! Your email notifications are working.</strong></p>
          <p style="color: #73645B; font-size: 14px; line-height: 1.6;">
            This email confirms that automated messages can be delivered to <strong>${to}</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #E6DED6; margin: 20px 0;" />
          <p style="font-size: 12px; color: #8C7B70; margin: 0;">
            Sent via Velour Notification Engine
          </p>
        </div>
      `,
      fromName: "Velour Hairs System",
    });

    if (result.success) {
      console.log(`\n🎉 Success! Test email sent to ${to} via [${result.provider.toUpperCase()}]!`);
      console.log(`📬 Check the inbox at ${to}`);
    } else {
      console.log("\n⚠️ Email was skipped. Check your configuration.");
    }
  } catch (err) {
    console.error("\n❌ Failed to send email to " + to + ":", err.message);
    if (err.message && err.message.includes("You can only send testing emails to your own email address")) {
      console.log("\n💡 WHY THIS HAPPENED:");
      console.log("   Resend free accounts in sandbox mode (onboarding@resend.dev) ONLY allow sending");
      console.log("   emails to your account email (azrielstudio45@gmail.com).");
      console.log("\n🔧 HOW TO FIX FOR ALL CUSTOMERS:");
      console.log("   1. Verify your custom domain at https://resend.com/domains");
      console.log("      and set RESEND_FROM_EMAIL=bookings@yourdomain.com in server/.env");
      console.log("   OR");
      console.log("   2. Generate a 16-character Gmail App Password (myaccount.google.com/apppasswords)");
      console.log("      and set EMAIL_APP_PASSWORD=xxxx in server/.env (Gmail SMTP sends to all emails without a custom domain).");
    }
  }
}

runDiagnostic();
