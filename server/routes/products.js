const express = require("express");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
const router = express.Router();

// Public: list all active products
router.get("/", async (req, res, next) => {
  try {
    const list = await db.products.list();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Public: get single product
router.get("/:id", async (req, res, next) => {
  try {
    const product = await db.products.get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Admin-only: create product
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { name, description, price, stock, image } = req.body;
    if (!name || price === undefined || price === null || price === "") {
      return res.status(400).json({ error: "name and price are required" });
    }

    const created = await db.products.create({
      name,
      description,
      price,
      stock,
      image,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Admin-only: update product
router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const updated = await db.products.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Admin-only: soft delete product
router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await db.products.remove(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
