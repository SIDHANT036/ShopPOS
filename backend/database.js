const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const os = require("os");

// ----------------------------------------------------
// Application data folder (cross-platform, stable regardless
// of whether this runs via "node server.js" in dev or bundled
// inside a packaged Electron app in production)
// ----------------------------------------------------

let appFolder;

switch (process.platform) {
  case "win32":
    appFolder = path.join(os.homedir(), "AppData", "Roaming", "Shop POS");
    break;

  case "darwin":
    appFolder = path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Shop POS"
    );
    break;

  default:
    appFolder = path.join(os.homedir(), ".shop-pos");
}

for (const sub of ["", "invoices", "backups"]) {
  const dir = sub ? path.join(appFolder, sub) : appFolder;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const invoicesFolder = path.join(appFolder, "invoices");
const backupsFolder = path.join(appFolder, "backups");

// ----------------------------------------------------
// Database
// ----------------------------------------------------

const databasePath = path.join(appFolder, "shop.db");

const db = new sqlite3.Database(databasePath, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite:", err.message);
  } else {
    console.log("SQLite connected.");
    console.log("Database:", databasePath);
  }
});

db.run("PRAGMA foreign_keys = ON");

// ----------------------------------------------------
// Tables
// ----------------------------------------------------

db.serialize(() => {
  // Inventory
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      barcode TEXT,
      cost REAL NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      gst REAL DEFAULT 18,
      lowStockThreshold INTEGER DEFAULT 5
    )
  `);

  // Sales
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNo TEXT,
      total REAL NOT NULL,
      gst REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      date TEXT NOT NULL
    )
  `);

  // Sale Items
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER NOT NULL,
      itemId INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      gst REAL DEFAULT 0,

      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items(id)
    )
  `);

  // Shop settings - single row, id fixed at 1
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      shopName TEXT DEFAULT 'My Shop',
      shopAddress TEXT DEFAULT '',
      shopPhone TEXT DEFAULT '',
      defaultGst REAL DEFAULT 18,
      defaultLowStockThreshold INTEGER DEFAULT 5
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO settings (id) VALUES (1)
  `);

  // ---- Migrations for anyone who already has a shop.db from
  // ---- an earlier version of this app (adding a column is a
  // ---- no-op error if it already exists, so we just swallow that).
  const migrations = [
    "ALTER TABLE items ADD COLUMN barcode TEXT",
    "ALTER TABLE items ADD COLUMN lowStockThreshold INTEGER DEFAULT 5",
    "ALTER TABLE sale_items ADD COLUMN gst REAL DEFAULT 0",
  ];

  migrations.forEach((sql) => {
    db.run(sql, () => {
      /* ignore "duplicate column name" errors on already-migrated DBs */
    });
  });
});

module.exports = { db, appFolder, invoicesFolder, backupsFolder };
