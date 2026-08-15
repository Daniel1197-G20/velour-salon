const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const router = express.Router();

// Public: list all active services
router.get("/", async (req, res, next) => {
  try {
    const list = await db.services.list();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Public: get single service
router.get("/:id", async (req, res, next) => {
  try {
    const service = await db.services.get(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(service);
  } catch (err) {
    next(err);
  }
});

// Admin-only: create service
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { name, category, description, price, duration_minutes, image } = req.body;
    if (!name || !category || price === undefined || price === null || price === "") {
      return res.status(400).json({ error: "name, category, price are required" });
    }

    const created = await db.services.create({
      name,
      category,
      description,
      price,
      duration_minutes,
      image,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Admin-only: update service
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const updated = await db.services.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin-only: soft delete service
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await db.services.remove(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
