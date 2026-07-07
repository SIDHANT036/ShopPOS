const express = require("express");
const cors = require("cors");

const db = require("./database");
const createPDF = require("./services/invoice");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================================
   INVENTORY
========================================================= */

// Get all items (supports ?search=abc)

app.get("/items", (req, res) => {
  const search = req.query.search || "";

  db.all(
    "SELECT * FROM items WHERE name LIKE ? ORDER BY name ASC",
    [`%${search}%`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      res.json(rows);
    }
  );
});

// Add item

app.post("/items", (req, res) => {
  const {
    name,
    category,
    cost,
    price,
    quantity,
    gst = 18,
  } = req.body;

  if (!name || !category) {
    return res.status(400).json({
      success: false,
      message: "Name and category are required.",
    });
  }

  db.run(
    `
    INSERT INTO items
    (name, category, cost, price, quantity, gst)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      name,
      category,
      cost,
      price,
      quantity,
      gst,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      res.status(201).json({
        success: true,
        id: this.lastID,
      });
    }
  );
});

// Update item

app.put("/items/:id", (req, res) => {
  const {
    name,
    category,
    cost,
    price,
    quantity,
    gst,
  } = req.body;

  db.run(
    `
    UPDATE items
    SET
      name=?,
      category=?,
      cost=?,
      price=?,
      quantity=?,
      gst=?
    WHERE id=?
    `,
    [
      name,
      category,
      cost,
      price,
      quantity,
      gst,
      req.params.id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      res.json({
        success: true,
        updated: this.changes,
      });
    }
  );
});

// Delete item

app.delete("/items/:id", (req, res) => {
  db.run(
    "DELETE FROM items WHERE id=?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      res.json({
        success: true,
        deleted: this.changes,
      });
    }
  );
});

/* =========================================================
   SALES
========================================================= */

app.post("/sale", (req, res) => {
  const {
    items = [],
    total = 0,
    gst = 0,
    profit = 0,
  } = req.body;

  if (!items.length) {
    return res.status(400).json({
      success: false,
      message: "Cart is empty.",
    });
  }

  const invoiceNo = `INV-${Date.now()}`;
  const saleDate = new Date().toISOString();

  db.run(
    `
    INSERT INTO sales
    (invoiceNo, total, gst, profit, date)
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      invoiceNo,
      total,
      gst,
      profit,
      saleDate,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      const saleId = this.lastID;

      items.forEach((item) => {
        db.run(
          `
          INSERT INTO sale_items
          (saleId,itemId,name,quantity,price)
          VALUES(?,?,?,?,?)
          `,
          [
            saleId,
            item.id,
            item.name,
            item.qty,
            item.price,
          ]
        );

        db.run(
          `
          UPDATE items
          SET quantity = quantity - ?
          WHERE id = ?
          `,
          [
            item.qty,
            item.id,
          ]
        );
      });

      try {
        createPDF({
          invoiceNo,
          items,
          total,
          gst,
        });
      } catch (e) {
        console.error("Invoice generation failed:", e.message);
      }

      res.status(201).json({
        success: true,
        saleId,
        invoiceNo,
      });
    }
  );
});

// Sales history

app.get("/sales", (req, res) => {
  db.all(
    "SELECT * FROM sales ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      res.json(rows);
    }
  );
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Shop POS Backend Running",
  });
});

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});