const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const os = require("os");

// ----------------------------------------------------
// Create application data folder (cross-platform)
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

if (!fs.existsSync(appFolder)) {
  fs.mkdirSync(appFolder, {
    recursive: true,
  });
}

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
      cost REAL NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      gst REAL DEFAULT 18
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

      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items(id)
    )
  `);
});

module.exports = db;