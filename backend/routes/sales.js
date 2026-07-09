const express = require("express");
const path = require("path");
const { db, invoicesFolder } = require("../database");
const createPDF = require("../services/invoice");

const router = express.Router();

function getSettings() {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM settings WHERE id = 1", [], (err, row) => {
      if (err) return reject(err);
      resolve(row || {});
    });
  });
}

/* POST /sale - record a completed sale, decrement stock, generate a PDF invoice */
router.post("/sale", async (req, res) => {
  const { items = [], total = 0, gst = 0, profit = 0 } = req.body;

  if (!items.length) {
    return res.status(400).json({ success: false, message: "Cart is empty." });
  }

  const invoiceNo = `INV-${Date.now()}`;
  const saleDate = new Date().toISOString();

  db.run(
    `INSERT INTO sales (invoiceNo, total, gst, profit, date) VALUES (?, ?, ?, ?, ?)`,
    [invoiceNo, total, gst, profit, saleDate],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      const saleId = this.lastID;

      items.forEach((item) => {
        db.run(
          `INSERT INTO sale_items (saleId, itemId, name, quantity, price, gst)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [saleId, item.id, item.name, item.qty, item.price, item.gst || 0]
        );

        db.run(`UPDATE items SET quantity = quantity - ? WHERE id = ?`, [
          item.qty,
          item.id,
        ]);
      });

      getSettings()
        .then((shop) => {
          let invoicePath = null;
          try {
            invoicePath = createPDF(
              { invoiceNo, items, subtotal: total - gst, gst, total },
              shop
            );
          } catch (e) {
            console.error("Invoice generation failed:", e.message);
          }

          res.status(201).json({
            success: true,
            saleId,
            invoiceNo,
            invoiceReady: !!invoicePath,
          });
        })
        .catch(() => {
          res.status(201).json({ success: true, saleId, invoiceNo, invoiceReady: false });
        });
    }
  );
});

/* GET /sales - history, most recent first */
router.get("/sales", (req, res) => {
  db.all("SELECT * FROM sales ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json(rows);
  });
});

/* GET /sales/:id - a single sale with its line items */
router.get("/sales/:id", (req, res) => {
  db.get("SELECT * FROM sales WHERE id = ?", [req.params.id], (err, sale) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found." });
    }

    db.all(
      "SELECT * FROM sale_items WHERE saleId = ?",
      [req.params.id],
      (err2, lineItems) => {
        if (err2) {
          return res.status(500).json({ success: false, message: err2.message });
        }
        res.json({ ...sale, items: lineItems });
      }
    );
  });
});

/* GET /invoice/:invoiceNo - download the generated PDF for a sale */
router.get("/invoice/:invoiceNo", (req, res) => {
  const filePath = path.join(invoicesFolder, `invoice_${req.params.invoiceNo}.pdf`);
  res.download(filePath, `${req.params.invoiceNo}.pdf`, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, message: "Invoice PDF not found." });
    }
  });
});

module.exports = router;
