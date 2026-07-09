const express = require("express");
const cors = require("cors");

require("./database"); // ensures tables + migrations run before routes are hit

const itemsRouter = require("./routes/items");
const salesRouter = require("./routes/sales");
const settingsRouter = require("./routes/settings");
const backupRouter = require("./routes/backup");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/items", itemsRouter);
app.use("/", salesRouter); // exposes /sale (POST), /sales, /sales/:id, /invoice/:invoiceNo
app.use("/settings", settingsRouter);
app.use("/backup", backupRouter);

/* Health check */
app.get("/", (req, res) => {
  res.json({ success: true, message: "Shop POS Backend Running" });
});

/**
 * Starts the HTTP server and resolves once it's actually listening.
 * Electron's main process awaits this instead of guessing with a
 * fixed timeout, and dev mode (`node server.js`) uses it too.
 */
function start(port = process.env.PORT || 5050) {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => {
        console.log(`Backend running on http://localhost:${port}`);
        resolve(port);
      })
      .on("error", reject);

    app.set("httpServer", server);
  });
}

// Only auto-start when this file is run directly (npm run backend / node server.js).
// When Electron requires this module, it controls startup timing itself.
if (require.main === module) {
  start();
}

module.exports = { app, start };
