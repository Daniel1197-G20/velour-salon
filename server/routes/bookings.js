const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const {
  sendBookingNotifications,
  sendBookingApprovedCustomerEmail,
  sendBookingRejectedCustomerEmail,
  verifyActionToken,
} = require("../lib/email");
const router = express.Router();

function getRequestBaseUrl(req) {
  if (process.env.BASE_URL && process.env.BASE_URL.startsWith("http")) {
    return process.env.BASE_URL.replace(/\/+$/, "");
  }
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return host ? `${protocol}://${host}` : "http://localhost:4000";
}

function renderActionPage({ title, statusType, headline, message, booking, baseUrl }) {
  const isApproved = statusType === "approved";
  const isRejected = statusType === "rejected";
  const isNotice = statusType === "notice";

  const badgeBg = isApproved ? "#E8F5E9" : isRejected ? "#FFEBEE" : isNotice ? "#FFF8E1" : "#FFEBEE";
  const badgeColor = isApproved ? "#2E7D32" : isRejected ? "#C62828" : isNotice ? "#B78103" : "#C62828";
  const icon = isApproved ? "✅" : isRejected ? "❌" : isNotice ? "ℹ️" : "⚠️";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Velour Hairs & Beauty</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #FAF8F5;
      color: #231815;
      margin: 0;
      padding: 40px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E6DED6;
      border-radius: 16px;
      max-width: 540px;
      width: 100%;
      padding: 32px 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      text-align: center;
    }
    .brand {
      color: #9E4759;
      letter-spacing: 2px;
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 16px 0;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      background-color: ${badgeBg};
      color: ${badgeColor};
      padding: 8px 16px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .title {
      font-size: 22px;
      margin: 0 0 10px 0;
      color: #231815;
    }
    .message {
      font-size: 15px;
      color: #73645B;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .details {
      background: #FAF8F5;
      border: 1px solid #E6DED6;
      border-radius: 12px;
      padding: 16px 20px;
      text-align: left;
      margin-bottom: 28px;
      font-size: 14px;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #EFE9E2;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #73645B;
    }
    .val {
      color: #231815;
      font-weight: 600;
      text-align: right;
    }
    .btn {
      display: inline-block;
      background-color: #231815;
      color: #FAF8F5;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn:hover {
      background-color: #9E4759;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Velour Hairs & Beauty</div>
    <div class="badge">${icon} ${statusType.toUpperCase()}</div>
    <h1 class="title">${headline}</h1>
    <p class="message">${message}</p>
    
    ${booking ? `
    <div class="details">
      <div class="details-row">
        <span class="label">Customer</span>
        <span class="val">${booking.customer_name}</span>
      </div>
      <div class="details-row">
        <span class="label">Service</span>
        <span class="val">${booking.service_name || booking.service?.name || "Salon Service"}</span>
      </div>
      <div class="details-row">
        <span class="label">Date</span>
        <span class="val">${booking.date}</span>
      </div>
      <div class="details-row">
        <span class="label">Time</span>
        <span class="val">${booking.time}</span>
      </div>
      <div class="details-row">
        <span class="label">Phone</span>
        <span class="val">${booking.phone}</span>
      </div>
      ${booking.email ? `
      <div class="details-row">
        <span class="label">Email</span>
        <span class="val">${booking.email}</span>
      </div>` : ""}
    </div>
    ` : ""}

    <div>
      <a href="${baseUrl}/admin" class="btn">Open Admin Dashboard</a>
    </div>
  </div>
</body>
</html>`;
}

// Public: create a booking
router.post("/", async (req, res, next) => {
  try {
    const { customer_name, phone, email, service_id, date, time, notes } = req.body;
    if (!customer_name || !phone || !service_id || !date || !time) {
      return res.status(400).json({ error: "customer_name, phone, service_id, date, time are required" });
    }

    const created = await db.bookings.create({
      customer_name,
      phone,
      email,
      service_id,
      date,
      time,
      notes,
    });

    const baseUrl = getRequestBaseUrl(req);

    // Send pending confirmation to customer & actionable notification to salon admin
    sendBookingNotifications({ booking: created, service: created.service, baseUrl }).catch((e) =>
      console.error("Booking email notification error:", e.message)
    );

    res.status(201).json(created);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});

// One-click Action Endpoint (Approve or Reject from Admin Email Link)
router.get("/action", async (req, res, next) => {
  try {
    const { id, action, token } = req.query;
    const baseUrl = getRequestBaseUrl(req);

    if (!id || !action || !token || !["approve", "reject"].includes(action)) {
      return res.status(400).send(
        renderActionPage({
          title: "Invalid Request",
          statusType: "error",
          headline: "Invalid Action Link",
          message: "The link you followed is missing required parameters or is improperly formatted.",
          booking: null,
          baseUrl,
        })
      );
    }

    // Verify security token
    const isValid = verifyActionToken(id, action, token);
    if (!isValid) {
      return res.status(403).send(
        renderActionPage({
          title: "Security Verification Failed",
          statusType: "error",
          headline: "Action Link Verification Failed",
          message: "The security token for this action link is invalid or has expired.",
          booking: null,
          baseUrl,
        })
      );
    }

    // Fetch booking
    const booking = await db.bookings.get(id);
    if (!booking) {
      return res.status(404).send(
        renderActionPage({
          title: "Booking Not Found",
          statusType: "error",
          headline: "Booking Not Found",
          message: "This booking could not be located in our records. It may have already been deleted.",
          booking: null,
          baseUrl,
        })
      );
    }

    // Handle idempotency / duplicate clicks
    if (action === "approve" && booking.status === "confirmed") {
      return res.send(
        renderActionPage({
          title: "Already Approved",
          statusType: "notice",
          headline: "Appointment Already Approved",
          message: "This appointment has already been confirmed earlier. A confirmation email was sent to the customer.",
          booking,
          baseUrl,
        })
      );
    }

    if (action === "reject" && booking.status === "cancelled") {
      return res.send(
        renderActionPage({
          title: "Already Declined",
          statusType: "notice",
          headline: "Appointment Already Declined",
          message: "This appointment request has already been declined earlier.",
          booking,
          baseUrl,
        })
      );
    }

    if (action === "approve") {
      const updated = await db.bookings.update(id, { status: "confirmed" });
      
      // Dispatch confirmed email to customer
      sendBookingApprovedCustomerEmail({ booking: updated, service: updated.service }).catch((e) =>
        console.error("Approval customer email error:", e.message)
      );

      return res.send(
        renderActionPage({
          title: "Appointment Approved",
          statusType: "approved",
          headline: "Appointment Approved Successfully!",
          message: booking.email
            ? `The appointment has been confirmed and a confirmation email has been dispatched to <strong>${booking.email}</strong>.`
            : "The appointment has been confirmed and is now marked as Confirmed in your system.",
          booking: updated,
          baseUrl,
        })
      );
    }

    if (action === "reject") {
      const updated = await db.bookings.update(id, { status: "cancelled" });

      // Dispatch decline email to customer
      sendBookingRejectedCustomerEmail({ booking: updated, service: updated.service, baseUrl }).catch((e) =>
        console.error("Rejection customer email error:", e.message)
      );

      return res.send(
        renderActionPage({
          title: "Appointment Declined",
          statusType: "rejected",
          headline: "Appointment Request Declined",
          message: booking.email
            ? `The appointment request has been declined and an update email has been sent to <strong>${booking.email}</strong>.`
            : "The appointment request has been declined.",
          booking: updated,
          baseUrl,
        })
      );
    }
  } catch (err) {
    next(err);
  }
});

// Public: check taken slots for a given date
router.get("/taken", async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date query param required" });

    const taken = await db.bookings.taken(date);
    res.json(taken);
  } catch (err) {
    next(err);
  }
});

// Admin: list all bookings
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const bookings = await db.bookings.list();
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// Admin: update booking status
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const prev = await db.bookings.get(req.params.id);
    const updated = await db.bookings.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const baseUrl = getRequestBaseUrl(req);

    // Send emails when status changes from Admin Dashboard
    if (req.body.status === "confirmed" && prev?.status !== "confirmed") {
      sendBookingApprovedCustomerEmail({ booking: updated, service: updated.service }).catch((e) =>
        console.error("Failed to send approval email:", e.message)
      );
    } else if (req.body.status === "cancelled" && prev?.status !== "cancelled") {
      sendBookingRejectedCustomerEmail({ booking: updated, service: updated.service, baseUrl }).catch((e) =>
        console.error("Failed to send cancellation email:", e.message)
      );
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin: delete booking
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await db.bookings.remove(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
