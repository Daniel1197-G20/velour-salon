const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { onRequest } = require("firebase-functions/v2/https");

// Initialize and seed Firestore database
require("./db");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Routes router
const router = express.Router();
router.get("/health", (req, res) => res.json({ ok: true, status: "healthy" }));
router.use("/services", require("./routes/services"));
router.use("/products", require("./routes/products"));
router.use("/bookings", require("./routes/bookings"));
router.use("/orders", require("./routes/orders"));
router.use("/admin", require("./routes/admin"));

// Mount on /api as well as / for flexibility across local, hosting rewrites, and direct function URL
app.use("/api", router);
app.use("/", router);

// Error handler
app.use((err, req, res, next) => {
  console.error("API Error:", err);
  res.status(500).json({ error: err.message || "Something went wrong on our end." });
});

// If running as a standalone server (Render, Railway, VPS, or local development)
if (!process.env.FUNCTION_TARGET && !process.env.K_SERVICE) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Velour Hairs API running on http://localhost:${PORT}`);
  });
}

// Export as Firebase Cloud Function v2
exports.api = onRequest({ cors: true, maxInstances: 10 }, app);
