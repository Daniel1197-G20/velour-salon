const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { sendOrderNotifications } = require("../lib/email");
const router = express.Router();

// Public: place an order (pay on arrival / pay on delivery)
router.post("/", async (req, res, next) => {
  try {
    const { customer_name, phone, email, address, items } = req.body;
    if (!customer_name || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "customer_name, phone, address, and items[] are required" });
    }

    const created = await db.orders.create({
      customer_name,
      phone,
      email,
      address,
      items,
    });

    // Send order notification email in background
    sendOrderNotifications({ order: created }).catch((e) =>
      console.error("Order email error:", e.message)
    );

    res.status(201).json(created);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});

// Admin: list all orders
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const orders = await db.orders.list();
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Admin: update order status
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const updated = await db.orders.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
