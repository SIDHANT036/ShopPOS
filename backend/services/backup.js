const fs = require("fs");
const path = require("path");
const { backupsFolder, appFolder } = require("../database");

const dbPath = path.join(appFolder, "shop.db");

function timestampForFilename() {
  // e.g. 2026-07-08T14-32-05
  return new Date().toISOString().replace(/:/g, "-").split(".")[0];
}

/**
 * Copies the live database file into the backups folder with a
 * timestamped name. Returns the backup's filename.
 */
function createBackup() {
  if (!fs.existsSync(dbPath)) {
    throw new Error("No database file found to back up yet.");
  }

  const filename = `shop-backup-${timestampForFilename()}.db`;
  const dest = path.join(backupsFolder, filename);

  fs.copyFileSync(dbPath, dest);

  return filename;
}

/**
 * Lists available backups, newest first.
 */
function listBackups() {
  return fs
    .readdirSync(backupsFolder)
    .filter((f) => f.endsWith(".db"))
    .map((filename) => {
      const stat = fs.statSync(path.join(backupsFolder, filename));
      return {
        filename,
        sizeBytes: stat.size,
        createdAt: stat.mtime,
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Restores the database from a given backup filename.
 * NOTE: this overwrites the live db file on disk. The route layer
 * tells the caller that the app needs a restart afterward so the
 * open SQLite connection picks up the restored file cleanly.
 */
function restoreBackup(filename) {
  const src = path.join(backupsFolder, filename);

  if (!fs.existsSync(src)) {
    throw new Error("That backup file doesn't exist.");
  }

  // Safety copy of current state before we overwrite it, just in case.
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(
      dbPath,
      path.join(backupsFolder, `pre-restore-${timestampForFilename()}.db`)
    );
  }

  fs.copyFileSync(src, dbPath);
}

module.exports = { createBackup, listBackups, restoreBackup };
