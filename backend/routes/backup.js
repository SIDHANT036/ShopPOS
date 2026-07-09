const express = require("express");
const { createBackup, listBackups, restoreBackup } = require("../services/backup");

const router = express.Router();

/* POST /backup - create a new backup now */
router.post("/", (req, res) => {
  try {
    const filename = createBackup();
    res.status(201).json({ success: true, filename });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* GET /backup - list existing backups, newest first */
router.get("/", (req, res) => {
  try {
    res.json(listBackups());
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/* POST /backup/restore  { filename } - restore the db from a backup file.
   The app should be restarted after this so the open connection
   picks up the restored data cleanly. */
router.post("/restore", (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ success: false, message: "filename is required." });
  }

  try {
    restoreBackup(filename);
    res.json({
      success: true,
      message: "Restored. Please restart Shop POS for it to take effect.",
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
