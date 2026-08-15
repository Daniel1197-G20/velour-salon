const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Determine if we should use Firebase Cloud Firestore or Local SQLite
const isFirebaseEnv = Boolean(
  process.env.K_SERVICE ||
  process.env.FUNCTION_TARGET ||
  process.env.FIREBASE_CONFIG ||
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  process.env.FIRESTORE_EMULATOR_HOST
);

let firestoreDb = null;

if (isFirebaseEnv) {
  try {
    const { initializeApp, getApps, cert } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");

    let app;
    if (!getApps().length) {
      let credential = null;
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (raw.trim().startsWith("{")) {
          credential = cert(JSON.parse(raw));
        } else {
          const filePath = path.resolve(process.cwd(), raw);
          if (fs.existsSync(filePath)) credential = cert(require(filePath));
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const credPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
        if (fs.existsSync(credPath)) credential = cert(require(credPath));
      }

      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.GCLOUD_PROJECT ||
        "velour-hairs";

      app = initializeApp({
        ...(credential ? { credential } : {}),
        projectId,
      });
    } else {
      app = getApps()[0];
    }
    firestoreDb = getFirestore(app);
    try {
      firestoreDb.settings({ ignoreUndefinedProperties: true });
    } catch {}
    console.log("🔥 [Database] Connected to Firebase Cloud Firestore");
  } catch (err) {
    console.warn("⚠️  [Firebase init note]:", err.message);
    firestoreDb = null;
  }
}

// ----------------------------------------------------
// LOCAL SQLITE DATABASE FALLBACK (FOR ZERO-CONFIG DEV)
// ----------------------------------------------------
let sqliteDb = null;
function getSqlite() {
  if (!sqliteDb) {
    const Database = require("better-sqlite3");
    const dbPath = path.join(__dirname, "velour.db");
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma("journal_mode = WAL");

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        image TEXT,
        active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        service_id TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT NOT NULL,
        items TEXT NOT NULL,
        total INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      );
    `);

    // Seed Admin
    const adminCount = sqliteDb.prepare("SELECT COUNT(*) as c FROM admins").get().c;
    if (adminCount === 0) {
      const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "velour2026", 10);
      sqliteDb.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(
        process.env.ADMIN_USERNAME || "admin",
        hash
      );
    }

    // Seed Services
    const serviceCount = sqliteDb.prepare("SELECT COUNT(*) as c FROM services").get().c;
    if (serviceCount === 0) {
      const insert = sqliteDb.prepare(
        "INSERT INTO services (name, category, description, price, duration_minutes, image) VALUES (?, ?, ?, ?, ?, ?)"
      );
      const seedServices = [
        ["Knotless Braids", "Braiding", "Tension-free knotless box braids, medium to jumbo sizes.", 25000, 240, ""],
        ["Cornrows & Feed-in", "Braiding", "Classic cornrows with feed-in styling, straight or patterned.", 12000, 120, ""],
        ["Ghana Weaving & Packing", "Braiding", "Sleek Ghana weaving with clean packing gel finish.", 10000, 90, ""],
        ["Gel & Sleek Styling", "Styling", "Sleek gel styles, ponytails, and edge laying.", 6000, 45, ""],
        ["Silk Press & Wash", "Styling", "Deep wash, treatment, and silk press blowout.", 15000, 120, ""],
        ["Locs Retwist / Relocking", "Locs", "Retwist and relocking for healthy, neat locs.", 18000, 150, ""],
        ["Starter Locs", "Locs", "New loc installation using interlocking or two-strand twists.", 30000, 240, ""],
        ["Wig Revamping", "Wigs", "Wig washing, styling, and unit restoration.", 8000, 90, ""],
        ["Wig Install & Customization", "Wigs", "Lace melt install with plucking and customization.", 20000, 150, ""],
        ["Relaxer Touch-up", "Treatment", "Relaxer application with protein treatment.", 13000, 120, ""],
      ];
      const insertMany = sqliteDb.transaction((rows) => {
        for (const r of rows) insert.run(...r);
      });
      insertMany(seedServices);
    }

    // Seed Products
    const productCount = sqliteDb.prepare("SELECT COUNT(*) as c FROM products").get().c;
    if (productCount === 0) {
      const insert = sqliteDb.prepare(
        "INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)"
      );
      const seedProducts = [
        ["Edge Control Gel", "Strong-hold edge control for laying edges without flaking.", 3500, 40, ""],
        ["Braiding Hair Bundle (Jumbo)", "Pre-stretched jumbo braiding hair, 3-pack.", 4500, 60, ""],
        ["Loc Retwist Gel", "Botanical retwist gel for locs, residue-free.", 5000, 25, ""],
        ["Silk Bonnet", "Adjustable satin-lined bonnet for night protection.", 2500, 50, ""],
        ["Scalp Oil Treatment", "Rosemary & tea tree scalp oil for growth and relief.", 4000, 35, ""],
        ["Wig Care Kit", "Shampoo, conditioner, and detangling brush for wigs.", 7000, 20, ""],
      ];
      const insertMany = sqliteDb.transaction((rows) => {
        for (const r of rows) insert.run(...r);
      });
      insertMany(seedProducts);
    }
  }
  return sqliteDb;
}

// ----------------------------------------------------
// UNIFIED DATA ACCESS LAYER (DAL)
// ----------------------------------------------------
const db = {
  services: {
    async list() {
      if (firestoreDb) {
        const snapshot = await firestoreDb.collection("services").get();
        const items = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.active !== false) items.push({ id: doc.id, ...data });
        });
        items.sort((a, b) => (a.category || "").localeCompare(b.category || "") || (a.name || "").localeCompare(b.name || ""));
        return items;
      }
      const s = getSqlite();
      const rows = s.prepare("SELECT * FROM services WHERE active = 1 ORDER BY category, name").all();
      return rows.map((r) => ({ ...r, id: String(r.id), active: Boolean(r.active) }));
    },

    async get(id) {
      if (firestoreDb) {
        const doc = await firestoreDb.collection("services").doc(String(id)).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
      }
      const s = getSqlite();
      const row = s.prepare("SELECT * FROM services WHERE id = ?").get(id);
      if (!row) return null;
      return { ...row, id: String(row.id), active: Boolean(row.active) };
    },

    async create({ name, category, description, price, duration_minutes, image }) {
      if (firestoreDb) {
        const data = {
          name: String(name).trim(),
          category: String(category).trim(),
          description: description || "",
          price: Number(price) || 0,
          duration_minutes: Number(duration_minutes) || 60,
          image: image || "",
          active: true,
          created_at: new Date().toISOString(),
        };
        const ref = await firestoreDb.collection("services").add(data);
        return { id: ref.id, ...data };
      }
      const s = getSqlite();
      const info = s
        .prepare("INSERT INTO services (name, category, description, price, duration_minutes, image) VALUES (?, ?, ?, ?, ?, ?)")
        .run(name, category, description || "", Number(price), Number(duration_minutes) || 60, image || "");
      return db.services.get(info.lastInsertRowid);
    },

    async update(id, updates) {
      if (firestoreDb) {
        const ref = firestoreDb.collection("services").doc(String(id));
        const doc = await ref.get();
        if (!doc.exists) return null;
        const merged = { ...updates };
        if (merged.price !== undefined) merged.price = Number(merged.price);
        if (merged.duration_minutes !== undefined) merged.duration_minutes = Number(merged.duration_minutes);
        await ref.set(merged, { merge: true });
        const updated = await ref.get();
        return { id: updated.id, ...updated.data() };
      }
      const existing = await db.services.get(id);
      if (!existing) return null;
      const merged = { ...existing, ...updates };
      const s = getSqlite();
      s.prepare("UPDATE services SET name=?, category=?, description=?, price=?, duration_minutes=?, image=?, active=? WHERE id=?").run(
        merged.name,
        merged.category,
        merged.description,
        merged.price,
        merged.duration_minutes,
        merged.image,
        merged.active ? 1 : 0,
        id
      );
      return db.services.get(id);
    },

    async remove(id) {
      if (firestoreDb) {
        const ref = firestoreDb.collection("services").doc(String(id));
        await ref.update({ active: false });
        return { ok: true };
      }
      const s = getSqlite();
      s.prepare("UPDATE services SET active = 0 WHERE id = ?").run(id);
      return { ok: true };
    },
  },

  products: {
    async list() {
      if (firestoreDb) {
        const snapshot = await firestoreDb.collection("products").get();
        const items = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.active !== false) items.push({ id: doc.id, ...data });
        });
        items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        return items;
      }
      const s = getSqlite();
      const rows = s.prepare("SELECT * FROM products WHERE active = 1 ORDER BY name").all();
      return rows.map((r) => ({ ...r, id: String(r.id), active: Boolean(r.active) }));
    },

    async get(id) {
      if (firestoreDb) {
        const doc = await firestoreDb.collection("products").doc(String(id)).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
      }
      const s = getSqlite();
      const row = s.prepare("SELECT * FROM products WHERE id = ?").get(id);
      if (!row) return null;
      return { ...row, id: String(row.id), active: Boolean(row.active) };
    },

    async create({ name, description, price, stock, image }) {
      if (firestoreDb) {
        const data = {
          name: String(name).trim(),
          description: description || "",
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          image: image || "",
          active: true,
          created_at: new Date().toISOString(),
        };
        const ref = await firestoreDb.collection("products").add(data);
        return { id: ref.id, ...data };
      }
      const s = getSqlite();
      const info = s
        .prepare("INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)")
        .run(name, description || "", Number(price), Number(stock) || 0, image || "");
      return db.products.get(info.lastInsertRowid);
    },

    async update(id, updates) {
      if (firestoreDb) {
        const ref = firestoreDb.collection("products").doc(String(id));
        const doc = await ref.get();
        if (!doc.exists) return null;
        const merged = { ...updates };
        if (merged.price !== undefined) merged.price = Number(merged.price);
        if (merged.stock !== undefined) merged.stock = Number(merged.stock);
        await ref.set(merged, { merge: true });
        const updated = await ref.get();
        return { id: updated.id, ...updated.data() };
      }
      const existing = await db.products.get(id);
      if (!existing) return null;
      const merged = { ...existing, ...updates };
      const s = getSqlite();
      s.prepare("UPDATE products SET name=?, description=?, price=?, stock=?, image=?, active=? WHERE id=?").run(
        merged.name,
        merged.description,
        merged.price,
        merged.stock,
        merged.image,
        merged.active ? 1 : 0,
        id
      );
      return db.products.get(id);
    },

    async remove(id) {
      if (firestoreDb) {
        const ref = firestoreDb.collection("products").doc(String(id));
        await ref.update({ active: false });
        return { ok: true };
      }
      const s = getSqlite();
      s.prepare("UPDATE products SET active = 0 WHERE id = ?").run(id);
      return { ok: true };
    },
  },

  bookings: {
    async get(id) {
      if (firestoreDb) {
        const doc = await firestoreDb.collection("bookings").doc(String(id)).get();
        if (!doc.exists) return null;
        const data = doc.data();
        let service = null;
        if (data.service_id) {
          service = await db.services.get(data.service_id);
        }
        return { id: doc.id, ...data, service };
      }
      const s = getSqlite();
      const row = s
        .prepare(`
          SELECT bookings.*, services.name as service_name, services.price as service_price, services.duration_minutes as service_duration
          FROM bookings LEFT JOIN services ON bookings.service_id = services.id
          WHERE bookings.id = ?
        `)
        .get(id);
      if (!row) return null;
      return {
        ...row,
        id: String(row.id),
        service: row.service_name
          ? {
              id: String(row.service_id),
              name: row.service_name,
              price: row.service_price,
              duration_minutes: row.service_duration,
            }
          : null,
      };
    },

    async create({ customer_name, phone, email, service_id, date, time, notes }) {
      const service = await db.services.get(service_id);
      if (!service) {
        const err = new Error("Service not found");
        err.statusCode = 404;
        throw err;
      }

      if (firestoreDb) {
        const clashesSnapshot = await firestoreDb
          .collection("bookings")
          .where("date", "==", date)
          .where("time", "==", time)
          .get();

        let isClash = false;
        clashesSnapshot.forEach((doc) => {
          if (doc.data().status !== "cancelled") isClash = true;
        });

        if (isClash) {
          const err = new Error("That time slot is already booked. Please choose another.");
          err.statusCode = 409;
          throw err;
        }

        const newBooking = {
          customer_name: String(customer_name).trim(),
          phone: String(phone).trim(),
          email: email ? String(email).trim() : "",
          service_id: String(service_id),
          service_name: service.name,
          service_price: service.price,
          date,
          time,
          notes: notes ? String(notes).trim() : "",
          status: "pending",
          created_at: new Date().toISOString(),
        };

        const docRef = await firestoreDb.collection("bookings").add(newBooking);
        return { id: docRef.id, ...newBooking, service };
      }

      const s = getSqlite();
      const clash = s
        .prepare("SELECT id FROM bookings WHERE date = ? AND time = ? AND status != 'cancelled'")
        .get(date, time);
      if (clash) {
        const err = new Error("That time slot is already booked. Please choose another.");
        err.statusCode = 409;
        throw err;
      }

      const info = s
        .prepare("INSERT INTO bookings (customer_name, phone, email, service_id, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(customer_name, phone, email || "", String(service_id), date, time, notes || "");
      return db.bookings.get(info.lastInsertRowid);
    },

    async taken(date) {
      if (firestoreDb) {
        const snapshot = await firestoreDb.collection("bookings").where("date", "==", date).get();
        const taken = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status !== "cancelled" && data.time) taken.push(data.time);
        });
        return taken;
      }
      const s = getSqlite();
      const rows = s.prepare("SELECT time FROM bookings WHERE date = ? AND status != 'cancelled'").all(date);
      return rows.map((r) => r.time);
    },

    async list() {
      if (firestoreDb) {
        const snapshot = await firestoreDb.collection("bookings").get();
        const bookings = [];
        snapshot.forEach((doc) => {
          bookings.push({ id: doc.id, ...doc.data() });
        });
        bookings.sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.time || "").localeCompare(a.time || ""));
        return bookings;
      }
      const s = getSqlite();
      const rows = s
        .prepare(`
          SELECT bookings.*, services.name as service_name, services.price as service_price
          FROM bookings JOIN services ON bookings.service_id = services.id
          ORDER BY bookings.date DESC, bookings.time DESC
        `)
        .all();
      return rows.map((r) => ({ ...r, id: String(r.id) }));
    },

    async update(id, { status }) {
      if (firestoreDb) {
        const ref = firestoreDb.collection("bookings").doc(String(id));
        const doc = await ref.get();
        if (!doc.exists) return null;
        await ref.update({ status });
        return db.bookings.get(id);
      }
      const s = getSqlite();
      const existing = s.prepare("SELECT * FROM bookings WHERE id = ?").get(id);
      if (!existing) return null;
      s.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status || existing.status, id);
      return db.bookings.get(id);
    },

    async remove(id) {
      if (firestoreDb) {
        const ref = firestoreDb.collection("bookings").doc(String(id));
        await ref.delete();
        return { ok: true };
      }
      const s = getSqlite();
      s.prepare("DELETE FROM bookings WHERE id = ?").run(id);
      return { ok: true };
    },
  },

  orders: {
    async create({ customer_name, phone, email, address, items }) {
      let total = 0;
      const resolvedItems = [];

      for (const item of items) {
        const prod = await db.products.get(item.product_id);
        if (!prod) {
          const err = new Error(`Product ${item.product_id} not found`);
          err.statusCode = 404;
          throw err;
        }
        const qty = Math.max(1, parseInt(item.quantity) || 1);
        const price = Number(prod.price) || 0;
        total += price * qty;
        resolvedItems.push({
          product_id: String(prod.id),
          name: prod.name,
          price,
          quantity: qty,
        });
      }

      if (firestoreDb) {
        const newOrder = {
          customer_name: String(customer_name).trim(),
          phone: String(phone).trim(),
          email: email ? String(email).trim() : "",
          address: String(address).trim(),
          items: resolvedItems,
          total,
          status: "pending",
          created_at: new Date().toISOString(),
        };
        const docRef = await firestoreDb.collection("orders").add(newOrder);
        return { id: docRef.id, ...newOrder };
      }

      const s = getSqlite();
      const info = s
        .prepare("INSERT INTO orders (customer_name, phone, email, address, items, total) VALUES (?, ?, ?, ?, ?, ?)")
        .run(customer_name, phone, email || "", address, JSON.stringify(resolvedItems), total);
      const order = s.prepare("SELECT * FROM orders WHERE id = ?").get(info.lastInsertRowid);
      return { ...order, id: String(order.id), items: resolvedItems };
    },

    async list() {
      if (firestoreDb) {
        const snapshot = await firestoreDb.collection("orders").get();
        const orders = [];
        snapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        orders.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        return orders;
      }
      const s = getSqlite();
      const rows = s.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
      return rows.map((r) => ({ ...r, id: String(r.id), items: JSON.parse(r.items) }));
    },

    async update(id, { status }) {
      if (firestoreDb) {
        const ref = firestoreDb.collection("orders").doc(String(id));
        const doc = await ref.get();
        if (!doc.exists) return null;
        await ref.update({ status });
        const updated = await ref.get();
        return { id: updated.id, ...updated.data() };
      }
      const s = getSqlite();
      const existing = s.prepare("SELECT * FROM orders WHERE id = ?").get(id);
      if (!existing) return null;
      s.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status || existing.status, id);
      const updated = s.prepare("SELECT * FROM orders WHERE id = ?").get(id);
      return { ...updated, id: String(updated.id), items: JSON.parse(updated.items) };
    },
  },

  admin: {
    async findByUsername(username) {
      if (firestoreDb) {
        const snapshot = await firestoreDb.collection("admins").where("username", "==", username).limit(1).get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
        return null;
      }
      const s = getSqlite();
      const row = s.prepare("SELECT * FROM admins WHERE username = ?").get(username);
      if (!row) return null;
      return { ...row, id: String(row.id) };
    },

    async getSummary() {
      if (firestoreDb) {
        const [bookingsSnap, ordersSnap, servicesSnap] = await Promise.all([
          firestoreDb.collection("bookings").get(),
          firestoreDb.collection("orders").get(),
          firestoreDb.collection("services").get(),
        ]);
        let pendingBookings = 0;
        bookingsSnap.forEach((doc) => {
          if (doc.data().status === "pending") pendingBookings++;
        });
        let pendingOrders = 0;
        let revenue = 0;
        ordersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === "pending") pendingOrders++;
          if (data.status !== "cancelled") revenue += Number(data.total) || 0;
        });
        let serviceCount = 0;
        servicesSnap.forEach((doc) => {
          if (doc.data().active !== false) serviceCount++;
        });
        return { pendingBookings, pendingOrders, revenue, serviceCount };
      }

      const s = getSqlite();
      const bookingCount = s.prepare("SELECT COUNT(*) c FROM bookings WHERE status = 'pending'").get().c;
      const orderCount = s.prepare("SELECT COUNT(*) c FROM orders WHERE status = 'pending'").get().c;
      const revenue = s.prepare("SELECT COALESCE(SUM(total),0) t FROM orders WHERE status != 'cancelled'").get().t;
      const serviceCount = s.prepare("SELECT COUNT(*) c FROM services WHERE active = 1").get().c;
      return { pendingBookings: bookingCount, pendingOrders: orderCount, revenue, serviceCount };
    },
  },
};

module.exports = db;
