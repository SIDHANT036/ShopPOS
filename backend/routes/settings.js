const express = require("express");
const { db } = require("../database");

const router = express.Router();

/* GET /settings */
router.get("/", (req, res) => {
  db.get("SELECT * FROM settings WHERE id = 1", [], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json(row || {});
  });
});

/* PUT /settings */
router.put("/", (req, res) => {
  const {
    shopName,
    shopAddress,
    shopPhone,
    defaultGst,
    defaultLowStockThreshold,
  } = req.body;

  db.run(
    `UPDATE settings
     SET shopName=?, shopAddress=?, shopPhone=?, defaultGst=?, defaultLowStockThreshold=?
     WHERE id=1`,
    [shopName, shopAddress, shopPhone, defaultGst, defaultLowStockThreshold],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, updated: this.changes });
    }
  );
});

module.exports = router;
