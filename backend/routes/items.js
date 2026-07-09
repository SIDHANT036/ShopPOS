const express = require("express");
const { db } = require("../database");

const router = express.Router();

/* GET /items?search=&category=&lowStock=true */
router.get("/", (req, res) => {
  const search = req.query.search || "";
  const category = req.query.category || "";
  const lowStockOnly = req.query.lowStock === "true";

  let sql = "SELECT * FROM items WHERE name LIKE ?";
  const params = [`%${search}%`];

  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }

  if (lowStockOnly) {
    sql += " AND quantity <= lowStockThreshold";
  }

  sql += " ORDER BY name ASC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json(rows);
  });
});

/* GET /items/categories - distinct category list, for the filter dropdown */
router.get("/categories", (req, res) => {
  db.all(
    "SELECT DISTINCT category FROM items WHERE category != '' ORDER BY category ASC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json(rows.map((r) => r.category));
    }
  );
});

/* POST /items */
router.post("/", (req, res) => {
  const {
    name,
    category,
    barcode = null,
    cost,
    price,
    quantity,
    gst = 18,
    lowStockThreshold = 5,
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({
      success: false,
      message: "Name and category are required.",
    });
  }

  db.run(
    `INSERT INTO items (name, category, barcode, cost, price, quantity, gst, lowStockThreshold)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category, barcode || null, cost, price, quantity, gst, lowStockThreshold],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.status(201).json({ success: true, id: this.lastID });
    }
  );
});

/* PUT /items/:id */
router.put("/:id", (req, res) => {
  const {
    name,
    category,
    barcode = null,
    cost,
    price,
    quantity,
    gst,
    lowStockThreshold = 5,
  } = req.body;

  db.run(
    `UPDATE items
     SET name=?, category=?, barcode=?, cost=?, price=?, quantity=?, gst=?, lowStockThreshold=?
     WHERE id=?`,
    [name, category, barcode || null, cost, price, quantity, gst, lowStockThreshold, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, updated: this.changes });
    }
  );
});

/* DELETE /items/:id */
router.delete("/:id", (req, res) => {
  db.run("DELETE FROM items WHERE id=?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, deleted: this.changes });
  });
});

/* POST /items/bulk - bulk import, e.g. from an uploaded Excel sheet.
   Body: { items: [{ name, category, barcode, cost, price, quantity, gst, lowStockThreshold }] }
   Matches an existing item by barcode (if given) or by name+category, and
   updates it; otherwise inserts a new row. */
router.post("/bulk", (req, res) => {
  const { items = [] } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "No items to import." });
  }

  let inserted = 0;
  let updated = 0;
  const errors = [];

  const findExisting = (item) =>
    new Promise((resolve, reject) => {
      if (item.barcode) {
        db.get("SELECT id FROM items WHERE barcode = ?", [item.barcode], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      } else {
        db.get(
          "SELECT id FROM items WHERE name = ? AND category = ?",
          [item.name, item.category],
          (err, row) => {
            if (err) return reject(err);
            resolve(row);
          }
        );
      }
    });

  (async () => {
    for (const raw of items) {
      const item = {
        name: raw.name,
        category: raw.category,
        barcode: raw.barcode || null,
        cost: Number(raw.cost) || 0,
        price: Number(raw.price) || 0,
        quantity: Number(raw.quantity) || 0,
        gst: raw.gst !== undefined && raw.gst !== "" ? Number(raw.gst) : 18,
        lowStockThreshold:
          raw.lowStockThreshold !== undefined && raw.lowStockThreshold !== ""
            ? Number(raw.lowStockThreshold)
            : 5,
      };

      if (!item.name || !item.category) {
        errors.push(`Skipped a row missing name/category.`);
        continue;
      }

      try {
        const existing = await findExisting(item);

        if (existing) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE items SET name=?, category=?, barcode=?, cost=?, price=?, quantity=?, gst=?, lowStockThreshold=?
               WHERE id=?`,
              [
                item.name,
                item.category,
                item.barcode,
                item.cost,
                item.price,
                item.quantity,
                item.gst,
                item.lowStockThreshold,
                existing.id,
              ],
              (err) => (err ? reject(err) : resolve())
            );
          });
          updated++;
        } else {
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO items (name, category, barcode, cost, price, quantity, gst, lowStockThreshold)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.name,
                item.category,
                item.barcode,
                item.cost,
                item.price,
                item.quantity,
                item.gst,
                item.lowStockThreshold,
              ],
              (err) => (err ? reject(err) : resolve())
            );
          });
          inserted++;
        }
      } catch (e) {
        errors.push(`${item.name || "row"}: ${e.message}`);
      }
    }

    res.json({ success: true, inserted, updated, errors });
  })();
});

module.exports = router;
