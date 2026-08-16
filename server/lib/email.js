const https = require("https");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

/**
 * Robust HTTPS POST helper forcing IPv4, handling timeouts, and retrying on transient network/DNS blips
 */
async function httpsPost(urlStr, headers, bodyObj, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const data = JSON.stringify(bodyObj);

        const req = https.request(
          {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: "POST",
            family: 4, // Force IPv4 to prevent Node.js fetch IPv6 resolution timeouts
            timeout: 12000,
            headers: {
              ...headers,
              "Content-Length": Buffer.byteLength(data),
            },
          },
          (res) => {
            let raw = "";
            res.on("data", (chunk) => (raw += chunk));
            res.on("end", () => {
              try {
                const parsed = raw ? JSON.parse(raw) : {};
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve(parsed);
                } else {
                  reject(new Error(parsed.message || `HTTP ${res.statusCode}: ${raw}`));
                }
              } catch (e) {
                reject(new Error(`Failed to parse response (HTTP ${res.statusCode}): ${raw}`));
              }
            });
          }
        );

        req.on("error", reject);
        req.on("timeout", () => {
          req.destroy();
          reject(new Error(`Connection to ${url.hostname} timed out`));
        });

        req.write(data);
        req.end();
      });
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Universal email sender:
 * 1. Brevo API (Recommended for free sending to ANY email WITHOUT custom domain)
 * 2. Resend API (Requires custom domain for external recipients)
 * 3. Generic SMTP (Brevo SMTP, Mailjet, Outlook, etc.)
 * 4. Gmail SMTP (Requires Google App Password)
 */
async function sendEmail({ to, subject, html, fromName = "Velour Hairs & Beauty", replyTo }) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  // 1. Brevo API (Free 300 emails/day to ANY recipient - NO DOMAIN REQUIRED)
  if (brevoApiKey) {
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL ||
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      emailUser ||
      "azrielstudio45@gmail.com";
    const recipients = (Array.isArray(to) ? to : [to]).map((email) => ({ email }));

    const payload = {
      sender: { name: fromName, email: senderEmail },
      to: recipients,
      subject,
      htmlContent: html,
    };

    if (replyTo) {
      payload.replyTo = typeof replyTo === "string" ? { email: replyTo } : replyTo;
    }

    try {
      const data = await httpsPost(
        "https://api.brevo.com/v3/smtp/email",
        {
          "api-key": brevoApiKey.trim(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        payload
      );

      return { success: true, provider: "brevo", id: data.messageId };
    } catch (err) {
      console.error("❌ [Brevo Primary Error]:", err.message);

      // Fallback Attempt: Try alternative host api.sendinblue.com
      try {
        console.log("🔄 [Brevo] Retrying via backup endpoint...");
        const backupData = await httpsPost(
          "https://api.sendinblue.com/v3/smtp/email",
          {
            "api-key": brevoApiKey.trim(),
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          payload
        );
        return { success: true, provider: "brevo-backup", id: backupData.messageId };
      } catch (backupErr) {
        console.error("❌ [Brevo Backup Error]:", backupErr.message);
        if (!resendApiKey && !smtpHost && (!emailUser || !emailPass)) {
          throw backupErr;
        }
      }
    }
  }

  // 2. Resend API
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || "Velour Hairs <onboarding@resend.dev>";
      const resendBody = {
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      };
      if (replyTo) {
        resendBody.reply_to = typeof replyTo === "string" ? replyTo : replyTo.email;
      }

      const data = await httpsPost(
        "https://api.resend.com/emails",
        {
          Authorization: `Bearer ${resendApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        resendBody
      );

      return { success: true, provider: "resend", id: data.id };
    } catch (err) {
      console.error("❌ [Resend Email Error]:", err.message);
      if (!smtpHost && (!emailUser || !emailPass)) {
        throw err;
      }
      console.log("🔄 [Email] Attempting fallback to SMTP...");
    }
  }

  // 3. Generic SMTP Transporter (Brevo SMTP, Mailjet, Outlook, etc.)
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"${fromName}" <${process.env.SMTP_FROM || smtpUser}>`,
        to,
        subject,
        html,
      };
      if (replyTo) {
        mailOptions.replyTo = typeof replyTo === "string" ? replyTo : replyTo.email;
      }

      const info = await transporter.sendMail(mailOptions);
      return { success: true, provider: "smtp", id: info.messageId };
    } catch (err) {
      console.error("❌ [Generic SMTP Error]:", err.message);
      if (!emailUser || !emailPass) {
        throw err;
      }
    }
  }

  // 4. Gmail SMTP Transporter
  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const mailOptions = {
        from: `"${fromName}" <${emailUser}>`,
        to,
        subject,
        html,
      };
      if (replyTo) {
        mailOptions.replyTo = typeof replyTo === "string" ? replyTo : replyTo.email;
      }

      const info = await transporter.sendMail(mailOptions);
      return { success: true, provider: "gmail-smtp", id: info.messageId };
    } catch (err) {
      console.error("❌ [Gmail SMTP Error]:", err.message);
      throw err;
    }
  }

  console.log(
    "ℹ️  [Email] Skipped: Set BREVO_API_KEY, RESEND_API_KEY, or SMTP credentials in server/.env"
  );
  return { success: false, skipped: true };
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getBaseUrl(customBaseUrl) {
  if (customBaseUrl && customBaseUrl.startsWith("http")) return customBaseUrl.replace(/\/+$/, "");
  if (process.env.BASE_URL && process.env.BASE_URL.startsWith("http")) return process.env.BASE_URL.replace(/\/+$/, "");
  if (process.env.APP_URL && process.env.APP_URL.startsWith("http")) return process.env.APP_URL.replace(/\/+$/, "");
  if (process.env.SITE_URL && process.env.SITE_URL.startsWith("http")) return process.env.SITE_URL.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    return `https://${process.env.FIREBASE_PROJECT_ID || "velour-salon-ce77e"}.web.app`;
  }
  return `http://localhost:${process.env.PORT || 4000}`;
}

/**
 * Generate secure HMAC token for one-click action links (Approve/Reject)
 */
function generateActionToken(bookingId, action) {
  const secret = process.env.JWT_SECRET || "velour-hairs-secret-change-me";
  return crypto.createHmac("sha256", secret).update(`${bookingId}:${action}`).digest("hex");
}

/**
 * Verify secure HMAC token for one-click action links
 */
function verifyActionToken(bookingId, action, token) {
  if (!bookingId || !action || !token) return false;
  const expected = generateActionToken(bookingId, action);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(String(token), "utf8"));
  } catch {
    return false;
  }
}

/**
 * 1. Initial Email to Customer: Appointment Request Received (Pending Salon Confirmation)
 */
async function sendBookingPendingCustomerEmail({ booking, service }) {
  if (!booking.email) return;

  const serviceName = service?.name || booking.service_name || "Salon Service";
  const servicePrice = formatPrice(service?.price || booking.service_price);
  const formattedDate = booking.date;
  const formattedTime = booking.time;
  const salonEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.BREVO_SENDER_EMAIL;

  const customerHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 28px; border-radius: 14px; border: 1px solid #E6DED6; color: #231815; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E6DED6;">
        <h2 style="color: #9E4759; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">VELOUR HAIRS & BEAUTY</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #73645B; text-transform: uppercase; letter-spacing: 1.5px;">Appointment Request Received</p>
      </div>

      <div style="margin-top: 24px; font-size: 15px; line-height: 1.6;">
        <p style="margin: 0 0 12px 0;">Hello <strong>${booking.customer_name}</strong>,</p>
        <p style="margin: 0 0 16px 0;">Thank you for choosing Velour Hairs & Beauty! We have received your appointment request and our salon team is currently reviewing your chosen time slot.</p>
      </div>

      <!-- Pending Status Banner -->
      <div style="background-color: #FFF8E1; border: 1px solid #FFE082; border-left: 4px solid #FFA000; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #8D6E63; font-weight: 600;">
          ⏳ Status: Pending Salon Confirmation
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #5D4037;">
          Your request is in our queue. As soon as the salon approves your appointment, you will receive an official confirmation email.
        </p>
      </div>

      <!-- Booking Details Card -->
      <div style="background-color: #FFFFFF; border-radius: 10px; padding: 22px; margin-top: 20px; border: 1px solid #E6DED6;">
        <h3 style="margin-top: 0; color: #9E4759; font-size: 16px; border-bottom: 1px dashed #E6DED6; padding-bottom: 10px;">Your Booking Request Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 9px 0; color: #73645B; width: 35%;"><strong>Service:</strong></td>
            <td style="padding: 9px 0; color: #231815;"><strong>${serviceName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #73645B;"><strong>Estimated Price:</strong></td>
            <td style="padding: 9px 0; color: #231815;">${servicePrice} <span style="font-size: 12px; color: #73645B;">(Pay on arrival)</span></td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #73645B;"><strong>Requested Date:</strong></td>
            <td style="padding: 9px 0; color: #231815; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #73645B;"><strong>Requested Time:</strong></td>
            <td style="padding: 9px 0; color: #231815; font-weight: 600;">${formattedTime}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #73645B;"><strong>Contact Phone:</strong></td>
            <td style="padding: 9px 0; color: #231815;">${booking.phone}</td>
          </tr>
          ${booking.notes ? `
          <tr>
            <td style="padding: 9px 0; color: #73645B;"><strong>Your Notes:</strong></td>
            <td style="padding: 9px 0; color: #231815; font-style: italic;">"${booking.notes}"</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- Salon Guidelines -->
      <div style="margin-top: 24px; padding: 16px; background-color: #EFE9E2; border-radius: 8px; font-size: 13px; color: #4A3E39; line-height: 1.5;">
        <strong>Need immediate assistance?</strong><br/>
        Feel free to call or WhatsApp us at: <a href="tel:08103043035" style="color: #9E4759; font-weight: bold; text-decoration: none;">0810 304 3035</a>.
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #73645B;">
        <p style="margin: 0 0 4px 0;">We appreciate your patience while we confirm your stylist's availability.</p>
        <p style="margin: 0; font-weight: bold;">Velour Hairs & Beauty</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: booking.email,
      subject: `⏳ Appointment Request Received: ${serviceName} (${formattedDate} @ ${formattedTime})`,
      html: customerHtml,
      fromName: "Velour Hairs & Beauty",
      replyTo: salonEmail,
    });
    console.log(`✉️ [Email] Customer pending request email sent to: ${booking.email}`);
  } catch (err) {
    console.error("❌ [Email] Failed to send customer pending request email:", err.message);
  }
}

/**
 * 2. Alert Email to Salon Admin: Includes Details + One-Click Approve / Reject Action Links
 */
async function sendBookingAdminNotification({ booking, service, baseUrl: customBaseUrl }) {
  const salonEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  if (!salonEmail) return;

  const serviceName = service?.name || booking.service_name || "Salon Service";
  const servicePrice = formatPrice(service?.price || booking.service_price);
  const formattedDate = booking.date;
  const formattedTime = booking.time;

  const baseUrl = getBaseUrl(customBaseUrl);
  const tokenApprove = generateActionToken(booking.id, "approve");
  const tokenReject = generateActionToken(booking.id, "reject");

  const approveUrl = `${baseUrl}/api/bookings/action?id=${booking.id}&action=approve&token=${tokenApprove}`;
  const rejectUrl = `${baseUrl}/api/bookings/action?id=${booking.id}&action=reject&token=${tokenReject}`;
  const dashboardUrl = `${baseUrl}/admin`;

  const ownerHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 28px; border-radius: 14px; border: 1px solid #E6DED6; color: #231815; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E6DED6;">
        <h2 style="color: #9E4759; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">VELOUR HAIRS & BEAUTY</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #73645B; text-transform: uppercase; letter-spacing: 1.5px;">New Appointment Request — Action Required</p>
      </div>

      <!-- Action Required Banner -->
      <div style="background-color: #FFF3E0; border: 1px solid #FFE0B2; border-left: 4px solid #FB8C00; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #E65100; font-weight: bold;">
          ⚡ Action Required: Approve or Reject this Appointment
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #6D4C41;">
          The customer is awaiting your confirmation. Click a button below to respond immediately.
        </p>
      </div>

      <!-- Appointment Details Card -->
      <div style="background-color: #FFFFFF; border-radius: 10px; padding: 22px; margin-top: 20px; border: 1px solid #E6DED6;">
        <h3 style="margin-top: 0; color: #231815; font-size: 17px; border-bottom: 1px dashed #E6DED6; padding-bottom: 10px;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #73645B; width: 35%;"><strong>Customer Name:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: 600;">${booking.customer_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Phone Number:</strong></td>
            <td style="padding: 8px 0;"><a href="tel:${booking.phone}" style="color: #9E4759; font-weight: bold; text-decoration: none;">${booking.phone}</a></td>
          </tr>
          ${booking.email ? `
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Email Address:</strong></td>
            <td style="padding: 8px 0; color: #231815;"><a href="mailto:${booking.email}" style="color: #9E4759; text-decoration: none;">${booking.email}</a></td>
          </tr>` : `
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Email Address:</strong></td>
            <td style="padding: 8px 0; color: #8C7B70; font-style: italic;">Not provided</td>
          </tr>`}
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Service:</strong></td>
            <td style="padding: 8px 0; color: #231815;"><strong>${serviceName}</strong> (${servicePrice})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Date:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: bold;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Time Slot:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: bold;">${formattedTime}</td>
          </tr>
          ${booking.notes ? `
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Customer Notes:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-style: italic;">"${booking.notes}"</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- Quick Action Buttons -->
      <div style="margin-top: 26px; text-align: center; background-color: #FFFFFF; border-radius: 10px; padding: 22px; border: 1px solid #E6DED6;">
        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #231815;">Click to respond directly:</p>
        <div style="display: inline-block;">
          <a href="${approveUrl}" style="background-color: #2E7D32; color: #FFFFFF; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 10px; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(46,125,50,0.2);">
            ✅ Approve Appointment
          </a>
          <a href="${rejectUrl}" style="background-color: #C62828; color: #FFFFFF; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(198,40,40,0.2);">
            ❌ Reject / Decline
          </a>
        </div>
        <p style="font-size: 12px; color: #73645B; margin: 14px 0 0 0; line-height: 1.4;">
          Approving or rejecting will instantly update the system and send an email update to the customer.
        </p>
      </div>

      <!-- Dashboard Link -->
      <div style="text-align: center; margin-top: 22px; font-size: 13px; color: #73645B;">
        <p style="margin: 0;">You can also manage all bookings anytime in your <a href="${dashboardUrl}" style="color: #9E4759; font-weight: bold; text-decoration: underline;">Admin Dashboard</a>.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: salonEmail,
      subject: `🗓️ [Action Required] New Appointment: ${booking.customer_name} - ${serviceName} (${formattedDate} @ ${formattedTime})`,
      html: ownerHtml,
      fromName: "Velour Booking System",
      replyTo: booking.email ? { email: booking.email, name: booking.customer_name } : undefined,
    });
    console.log(`✉️ [Email] Owner actionable notification sent to: ${salonEmail}`);
  } catch (err) {
    console.error("❌ [Email] Failed to send owner notification:", err.message);
  }
}

/**
 * 3. Email to Customer: Appointment Approved & Confirmed
 */
async function sendBookingApprovedCustomerEmail({ booking, service }) {
  if (!booking.email) return;

  const serviceName = service?.name || booking.service_name || "Salon Service";
  const servicePrice = formatPrice(service?.price || booking.service_price);
  const formattedDate = booking.date;
  const formattedTime = booking.time;
  const salonEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.BREVO_SENDER_EMAIL;

  const customerHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 28px; border-radius: 14px; border: 1px solid #E6DED6; color: #231815; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E6DED6;">
        <h2 style="color: #9E4759; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">VELOUR HAIRS & BEAUTY</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #73645B; text-transform: uppercase; letter-spacing: 1.5px;">Appointment Confirmed</p>
      </div>

      <div style="margin-top: 24px; font-size: 15px; line-height: 1.6;">
        <p style="margin: 0 0 12px 0;">Hello <strong>${booking.customer_name}</strong>,</p>
        <p style="margin: 0 0 16px 0;">Great news! Your appointment has been <strong>approved and confirmed</strong> by our salon team. We look forward to providing you with an exceptional beauty experience.</p>
      </div>

      <!-- Confirmed Badge -->
      <div style="background-color: #E8F5E9; border: 1px solid #A5D6A7; border-left: 4px solid #2E7D32; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #2E7D32; font-weight: bold;">
          ✅ Status: Confirmed & Ready
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #1B5E20;">
          Your appointment on <strong>${formattedDate}</strong> at <strong>${formattedTime}</strong> is locked in.
        </p>
      </div>

      <!-- Booking Summary Card -->
      <div style="background-color: #FFFFFF; border-radius: 10px; padding: 22px; margin-top: 20px; border: 1px solid #E6DED6;">
        <h3 style="margin-top: 0; color: #9E4759; font-size: 16px; border-bottom: 1px dashed #E6DED6; padding-bottom: 10px;">Booking Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 9px 0; color: #73645B; width: 35%;"><strong>Service:</strong></td>
            <td style="padding: 9px 0; color: #231815;"><strong>${serviceName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #73645B;"><strong>Price:</strong></td>
            <td style="padding: 9px 0; color: #231815;">${servicePrice} <span style="font-size: 12px; color: #73645B;">(Pay on arrival)</span></td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #73645B;"><strong>Confirmed Date:</strong></td>
            <td style="padding: 9px 0; color: #231815; font-weight: 600;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 9px 0; color: #73645B;"><strong>Confirmed Time:</strong></td>
            <td style="padding: 9px 0; color: #231815; font-weight: 600;">${formattedTime}</td>
          </tr>
        </table>
      </div>

      <!-- Salon Guidelines & Location -->
      <div style="margin-top: 24px; padding: 18px; background-color: #EFE9E2; border-radius: 8px; font-size: 13px; color: #4A3E39; line-height: 1.6;">
        <strong style="color: #231815;">Salon Guidelines & Arrival:</strong><br/>
        • Please arrive 10 minutes prior to your scheduled time.<br/>
        • If you need to reschedule or need directions, call or WhatsApp us at: <a href="tel:08103043035" style="color: #9E4759; font-weight: bold; text-decoration: none;">0810 304 3035</a>.
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #73645B;">
        <p style="margin: 0 0 4px 0;">We look forward to giving you the look you love!</p>
        <p style="margin: 0; font-weight: bold;">Velour Hairs & Beauty</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: booking.email,
      subject: `🎉 Appointment Confirmed: ${serviceName} on ${formattedDate} at ${formattedTime}`,
      html: customerHtml,
      fromName: "Velour Hairs & Beauty",
      replyTo: salonEmail,
    });
    console.log(`✉️ [Email] Customer confirmation/approval sent to: ${booking.email}`);
  } catch (err) {
    console.error("❌ [Email] Failed to send customer approval email:", err.message);
  }
}

/**
 * 4. Alert Email to Salon Admin: Appointment Confirmed Receipt / Status Notice
 */
async function sendBookingApprovedAdminNotification({ booking, service, baseUrl: customBaseUrl }) {
  const salonEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  if (!salonEmail) return;

  const serviceName = service?.name || booking.service_name || "Salon Service";
  const servicePrice = formatPrice(service?.price || booking.service_price);
  const formattedDate = booking.date;
  const formattedTime = booking.time;
  const baseUrl = getBaseUrl(customBaseUrl);
  const dashboardUrl = `${baseUrl}/admin`;

  const adminHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 28px; border-radius: 14px; border: 1px solid #E6DED6; color: #231815; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E6DED6;">
        <h2 style="color: #9E4759; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">VELOUR HAIRS & BEAUTY</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #73645B; text-transform: uppercase; letter-spacing: 1.5px;">Appointment Confirmed Notification</p>
      </div>

      <!-- Confirmation Status Banner -->
      <div style="background-color: #E8F5E9; border: 1px solid #A5D6A7; border-left: 4px solid #2E7D32; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 15px; color: #2E7D32; font-weight: bold;">
          ✅ Appointment Successfully Confirmed
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #1B5E20;">
          This booking is confirmed on your schedule.${booking.email ? ` A confirmation email was delivered to <strong>${booking.email}</strong>.` : ""}
        </p>
      </div>

      <!-- Booking Details Card -->
      <div style="background-color: #FFFFFF; border-radius: 10px; padding: 22px; margin-top: 20px; border: 1px solid #E6DED6;">
        <h3 style="margin-top: 0; color: #231815; font-size: 16px; border-bottom: 1px dashed #E6DED6; padding-bottom: 10px;">Confirmed Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #73645B; width: 35%;"><strong>Customer:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: 600;">${booking.customer_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0;"><a href="tel:${booking.phone}" style="color: #9E4759; font-weight: bold; text-decoration: none;">${booking.phone}</a></td>
          </tr>
          ${booking.email ? `
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; color: #231815;"><a href="mailto:${booking.email}" style="color: #9E4759; text-decoration: none;">${booking.email}</a></td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Service:</strong></td>
            <td style="padding: 8px 0; color: #231815;"><strong>${serviceName}</strong> (${servicePrice})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Confirmed Date:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: bold;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Confirmed Time:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: bold;">${formattedTime}</td>
          </tr>
          ${booking.notes ? `
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Customer Notes:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-style: italic;">"${booking.notes}"</td>
          </tr>` : ""}
        </table>
      </div>

      <!-- Dashboard CTA -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="${dashboardUrl}" style="background-color: #231815; color: #FAF8F5; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
          Open Admin Dashboard
        </a>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: salonEmail,
      subject: `✅ [Confirmed] Appointment: ${booking.customer_name} - ${serviceName} (${formattedDate} @ ${formattedTime})`,
      html: adminHtml,
      fromName: "Velour Booking System",
      replyTo: booking.email ? { email: booking.email, name: booking.customer_name } : undefined,
    });
    console.log(`✉️ [Email] Admin confirmation receipt sent to: ${salonEmail}`);
  } catch (err) {
    console.error("❌ [Email] Failed to send admin confirmation email:", err.message);
  }
}

/**
 * 5. Email to Customer: Appointment Rejected / Cancelled
 */
async function sendBookingRejectedCustomerEmail({ booking, service, baseUrl: customBaseUrl }) {
  if (!booking.email) return;

  const serviceName = service?.name || booking.service_name || "Salon Service";
  const formattedDate = booking.date;
  const formattedTime = booking.time;
  const baseUrl = getBaseUrl(customBaseUrl);
  const bookingPageUrl = `${baseUrl}/booking`;
  const salonEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.BREVO_SENDER_EMAIL;

  const customerHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 28px; border-radius: 14px; border: 1px solid #E6DED6; color: #231815; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E6DED6;">
        <h2 style="color: #9E4759; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">VELOUR HAIRS & BEAUTY</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #73645B; text-transform: uppercase; letter-spacing: 1.5px;">Appointment Status Update</p>
      </div>

      <div style="margin-top: 24px; font-size: 15px; line-height: 1.6;">
        <p style="margin: 0 0 12px 0;">Hello <strong>${booking.customer_name}</strong>,</p>
        <p style="margin: 0 0 16px 0;">Thank you for reaching out to Velour Hairs & Beauty. Unfortunately, we are unable to accept your requested appointment for <strong>${serviceName}</strong> on <strong>${formattedDate}</strong> at <strong>${formattedTime}</strong> due to a scheduling conflict or stylist availability.</p>
      </div>

      <!-- Declined Status Banner -->
      <div style="background-color: #FFEBEE; border: 1px solid #FFCDD2; border-left: 4px solid #C62828; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #C62828; font-weight: bold;">
          ⚠️ Status: Time Slot Unavailable
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #5D4037;">
          We apologize for the inconvenience and would love to accommodate you at another time!
        </p>
      </div>

      <!-- Alternative Action Box -->
      <div style="background-color: #FFFFFF; border-radius: 10px; padding: 22px; margin-top: 20px; border: 1px solid #E6DED6; text-align: center;">
        <h3 style="margin-top: 0; color: #231815; font-size: 16px;">Choose an Alternative Slot</h3>
        <p style="font-size: 14px; color: #73645B; margin: 8px 0 18px 0; line-height: 1.5;">
          Please select another convenient date or time that suits your schedule:
        </p>
        <a href="${bookingPageUrl}" style="background-color: #9E4759; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
          📅 Book Another Slot
        </a>
        <p style="font-size: 13px; color: #73645B; margin: 16px 0 0 0;">
          Or call / WhatsApp us directly at <a href="tel:08103043035" style="color: #9E4759; font-weight: bold; text-decoration: none;">0810 304 3035</a> to help find the next best opening.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #73645B;">
        <p style="margin: 0 0 4px 0;">We hope to see you soon at Velour Hairs & Beauty.</p>
        <p style="margin: 0; font-weight: bold;">Velour Hairs & Beauty Team</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: booking.email,
      subject: `Update regarding your appointment request - Velour Hairs & Beauty`,
      html: customerHtml,
      fromName: "Velour Hairs & Beauty",
      replyTo: salonEmail,
    });
    console.log(`✉️ [Email] Customer rejection/cancellation sent to: ${booking.email}`);
  } catch (err) {
    console.error("❌ [Email] Failed to send customer rejection email:", err.message);
  }
}

/**
 * 6. Alert Email to Salon Admin: Appointment Rejected / Cancelled Notice
 */
async function sendBookingRejectedAdminNotification({ booking, service, baseUrl: customBaseUrl }) {
  const salonEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  if (!salonEmail) return;

  const serviceName = service?.name || booking.service_name || "Salon Service";
  const formattedDate = booking.date;
  const formattedTime = booking.time;
  const baseUrl = getBaseUrl(customBaseUrl);
  const dashboardUrl = `${baseUrl}/admin`;

  const adminHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 28px; border-radius: 14px; border: 1px solid #E6DED6; color: #231815; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E6DED6;">
        <h2 style="color: #9E4759; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">VELOUR HAIRS & BEAUTY</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #73645B; text-transform: uppercase; letter-spacing: 1.5px;">Appointment Declined / Cancelled</p>
      </div>

      <!-- Declined Status Banner -->
      <div style="background-color: #FFEBEE; border: 1px solid #FFCDD2; border-left: 4px solid #C62828; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; font-size: 15px; color: #C62828; font-weight: bold;">
          ❌ Appointment Request Declined / Cancelled
        </p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #5D4037;">
          This booking has been marked as cancelled.${booking.email ? ` A status update email was dispatched to <strong>${booking.email}</strong>.` : ""}
        </p>
      </div>

      <!-- Booking Details Card -->
      <div style="background-color: #FFFFFF; border-radius: 10px; padding: 22px; margin-top: 20px; border: 1px solid #E6DED6;">
        <h3 style="margin-top: 0; color: #231815; font-size: 16px; border-bottom: 1px dashed #E6DED6; padding-bottom: 10px;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #73645B; width: 35%;"><strong>Customer:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: 600;">${booking.customer_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Phone:</strong></td>
            <td style="padding: 8px 0;"><a href="tel:${booking.phone}" style="color: #9E4759; font-weight: bold; text-decoration: none;">${booking.phone}</a></td>
          </tr>
          ${booking.email ? `
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Email:</strong></td>
            <td style="padding: 8px 0; color: #231815;"><a href="mailto:${booking.email}" style="color: #9E4759; text-decoration: none;">${booking.email}</a></td>
          </tr>` : ""}
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Service:</strong></td>
            <td style="padding: 8px 0; color: #231815;"><strong>${serviceName}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Date:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: bold;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #73645B;"><strong>Time:</strong></td>
            <td style="padding: 8px 0; color: #231815; font-weight: bold;">${formattedTime}</td>
          </tr>
        </table>
      </div>

      <!-- Dashboard CTA -->
      <div style="text-align: center; margin-top: 24px;">
        <a href="${dashboardUrl}" style="background-color: #231815; color: #FAF8F5; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
          Open Admin Dashboard
        </a>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: salonEmail,
      subject: `❌ [Declined] Appointment: ${booking.customer_name} - ${serviceName} (${formattedDate} @ ${formattedTime})`,
      html: adminHtml,
      fromName: "Velour Booking System",
      replyTo: booking.email ? { email: booking.email, name: booking.customer_name } : undefined,
    });
    console.log(`✉️ [Email] Admin rejection notice sent to: ${salonEmail}`);
  } catch (err) {
    console.error("❌ [Email] Failed to send admin rejection notice:", err.message);
  }
}

/**
 * Master method called when a new booking is created:
 * 1. Sends pending acknowledgment email to customer
 * 2. Sends actionable notification email (Approve/Reject) to Salon Admin
 */
async function sendBookingNotifications({ booking, service, baseUrl }) {
  await Promise.allSettled([
    sendBookingAdminNotification({ booking, service, baseUrl }),
    sendBookingPendingCustomerEmail({ booking, service }),
  ]);
}

/**
 * Master method called when a booking is confirmed/approved:
 * 1. Sends confirmed email to customer
 * 2. Sends confirmed notification receipt to Salon Admin
 */
async function sendBookingApprovedNotifications({ booking, service, baseUrl }) {
  await Promise.allSettled([
    sendBookingApprovedCustomerEmail({ booking, service }),
    sendBookingApprovedAdminNotification({ booking, service, baseUrl }),
  ]);
}

/**
 * Master method called when a booking is rejected/cancelled:
 * 1. Sends decline email to customer
 * 2. Sends decline notification to Salon Admin
 */
async function sendBookingRejectedNotifications({ booking, service, baseUrl }) {
  await Promise.allSettled([
    sendBookingRejectedCustomerEmail({ booking, service, baseUrl }),
    sendBookingRejectedAdminNotification({ booking, service, baseUrl }),
  ]);
}

/**
 * Send email confirmation receipt to customer for product order
 */
async function sendOrderCustomerConfirmation({ order }) {
  if (!order.email) return;

  const itemsList = (order.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 0; color: #231815;"><strong>${item.quantity || 1}x</strong> ${item.name}</td>
          <td style="padding: 8px 0; color: #231815; text-align: right; font-weight: 600;">${formatPrice((item.price || 0) * (item.quantity || 1))}</td>
        </tr>`
    )
    .join("");

  const salonEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.BREVO_SENDER_EMAIL;

  const customerHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 28px; border-radius: 14px; border: 1px solid #E6DED6; color: #231815; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E6DED6;">
        <h2 style="color: #9E4759; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: 700;">VELOUR HAIRS & BEAUTY</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #73645B; text-transform: uppercase; letter-spacing: 1.5px;">Order Confirmation</p>
      </div>

      <div style="margin-top: 24px; font-size: 15px; line-height: 1.6;">
        <p style="margin: 0 0 12px 0;">Hello <strong>${order.customer_name}</strong>,</p>
        <p style="margin: 0 0 16px 0;">Thank you for shopping with Velour Hairs & Beauty! We have received your order and our team is preparing it for delivery.</p>
      </div>

      <!-- Order Summary Card -->
      <div style="background-color: #FFFFFF; border-radius: 10px; padding: 22px; margin-top: 20px; border: 1px solid #E6DED6;">
        <h3 style="margin-top: 0; color: #9E4759; font-size: 16px; border-bottom: 1px dashed #E6DED6; padding-bottom: 10px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${itemsList}
          <tr style="border-top: 2px solid #E6DED6;">
            <td style="padding: 12px 0 4px 0; color: #231815; font-weight: bold; font-size: 15px;">Total Amount (Pay on Delivery):</td>
            <td style="padding: 12px 0 4px 0; color: #9E4759; text-align: right; font-weight: bold; font-size: 16px;">${formatPrice(order.total)}</td>
          </tr>
        </table>

        <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed #E6DED6; font-size: 13px; color: #73645B;">
          <p style="margin: 0 0 4px 0;"><strong>Delivery Address:</strong> ${order.address}</p>
          <p style="margin: 0;"><strong>Contact Phone:</strong> ${order.phone}</p>
        </div>
      </div>

      <!-- Support Box -->
      <div style="margin-top: 24px; padding: 16px; background-color: #EFE9E2; border-radius: 8px; font-size: 13px; color: #4A3E39; line-height: 1.5;">
        <strong>Questions about your delivery?</strong><br/>
        Contact our store support at <a href="tel:08103043035" style="color: #9E4759; font-weight: bold; text-decoration: none;">0810 304 3035</a>.
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #73645B;">
        <p style="margin: 0; font-weight: bold;">Velour Hairs & Beauty</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: order.email,
      subject: `🛍️ Order Confirmed - Velour Hairs & Beauty (${formatPrice(order.total)})`,
      html: customerHtml,
      fromName: "Velour Hairs Store",
      replyTo: salonEmail,
    });
    console.log(`✉️ [Email] Customer order confirmation sent to: ${order.email}`);
  } catch (err) {
    console.error("❌ [Email] Failed to send customer order confirmation:", err.message);
  }
}

/**
 * Send email notification for a new product order to Admin
 */
async function sendOrderAdminNotification({ order }) {
  const salonEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  if (!salonEmail) return;

  const itemsList = (order.items || [])
    .map(
      (item) =>
        `<li><strong>${item.quantity || 1}x</strong> ${item.name} — ${formatPrice((item.price || 0) * (item.quantity || 1))}</li>`
    )
    .join("");

  const ownerHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 24px; border-radius: 12px; border: 1px solid #E6DED6; color: #231815;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #E6DED6;">
        <h2 style="color: #9E4759; margin: 0; font-size: 22px; letter-spacing: 1px;">VELOUR HAIRS & BEAUTY</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #73645B; text-transform: uppercase; letter-spacing: 1.5px;">New Product Order Placed</p>
      </div>

      <div style="background-color: #FFFFFF; border-radius: 8px; padding: 20px; margin-top: 20px; border: 1px solid #E6DED6;">
        <h3 style="margin-top: 0; color: #231815; font-size: 17px;">Order Details (Total: ${formatPrice(order.total)})</h3>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Customer:</strong> ${order.customer_name}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Phone:</strong> <a href="tel:${order.phone}" style="color: #9E4759; font-weight: bold;">${order.phone}</a></p>
        ${order.email ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${order.email}" style="color: #9E4759;">${order.email}</a></p>` : ""}
        <p style="margin: 4px 0; font-size: 14px;"><strong>Delivery Address:</strong> ${order.address}</p>

        <h4 style="margin: 16px 0 8px 0; color: #73645B; font-size: 14px;">Ordered Items:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #231815;">
          ${itemsList}
        </ul>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: salonEmail,
      subject: `🛍️ New Product Order: ${order.customer_name} (${formatPrice(order.total)})`,
      html: ownerHtml,
      fromName: "Velour Hairs Store",
      replyTo: order.email ? { email: order.email, name: order.customer_name } : undefined,
    });
    console.log(`✉️ [Email] Admin order notification sent to: ${salonEmail}`);
  } catch (err) {
    console.error("❌ [Email] Failed to send admin order notification:", err.message);
  }
}

/**
 * Master method called when a new product order is placed:
 * 1. Sends order alert to Salon Admin
 * 2. Sends receipt confirmation to Customer (if customer email is present)
 */
async function sendOrderNotifications({ order }) {
  await Promise.allSettled([
    sendOrderAdminNotification({ order }),
    sendOrderCustomerConfirmation({ order }),
  ]);
}

module.exports = {
  sendEmail,
  generateActionToken,
  verifyActionToken,
  sendBookingPendingCustomerEmail,
  sendBookingAdminNotification,
  sendBookingApprovedCustomerEmail,
  sendBookingApprovedAdminNotification,
  sendBookingRejectedCustomerEmail,
  sendBookingRejectedAdminNotification,
  sendBookingNotifications,
  sendBookingApprovedNotifications,
  sendBookingRejectedNotifications,
  sendOrderAdminNotification,
  sendOrderCustomerConfirmation,
  sendOrderNotifications,
};
