const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { requireAdmin } = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    let valid = false;
    let loggedInUsername = username;

    const adminUser = await db.admin.findByUsername(username);
    if (adminUser) {
      valid = bcrypt.compareSync(password || "", adminUser.password_hash || "");
      loggedInUsername = adminUser.username;
    } else {
      // Fallback check against environment variables
      const envUser = process.env.ADMIN_USERNAME || "";
      const envPass = process.env.ADMIN_PASSWORD || "";
      if (username === envUser && password === envPass) {
        valid = true;
        loggedInUsername = envUser;
      }
    }

    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const secret = process.env.JWT_SECRET || "velour-hairs-secret-change-me";
    const token = jwt.sign({ username: loggedInUsername }, secret, {
      expiresIn: "12h",
    });

    res.json({ token, username: loggedInUsername });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

// Dashboard summary stats
router.get("/summary", requireAdmin, async (req, res, next) => {
  try {
    const summary = await db.admin.getSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
