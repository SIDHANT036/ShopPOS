# Shop POS

An offline-first stock management and billing (POS) desktop app for small
retail shops. Runs entirely on the local machine — no internet connection
or external services required after install.

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express, running inside the Electron process
- **Database:** SQLite, stored in your OS's application-data folder
- **Desktop shell:** Electron
- **Invoices:** PDF (pdfkit) and Excel (SheetJS/xlsx)

## Features

- Inventory: add/edit/delete items with barcode, category, cost & selling
  price, stock quantity, per-item GST rate, and a low-stock threshold
- Search, category filter, and a "low stock only" view, plus a low-stock
  alert banner
- Bulk import/export of inventory via Excel (`.xlsx`)
- Billing: build a cart by tapping products or "scanning" a barcode (type
  the code into the scan box and press Enter — this is how real USB
  barcode scanners behave, since they just type + Enter)
- GST is calculated per line item using that item's own rate (not one
  flat rate for the whole cart), with a configurable default for new items
- Professional PDF invoices (shop name/address/phone, itemised GST) and
  Excel invoice export
- Sales dashboard: revenue, profit, low-stock count, recent-sales chart
- Local backup/restore of the database from the Settings page

## Project layout

```
ShopPOS/
├── backend/          Express API (SQLite, invoices, backups)
│   ├── routes/        items, sales, settings, backup
│   ├── services/      invoice.js (PDF), backup.js
│   └── database.js    schema + cross-platform app-data path
├── frontend/         React app (Vite)
│   └── src/
│       ├── components/  Sidebar, ItemForm, ItemTable, Cart
│       └── pages/       Inventory, Billing, Dashboard, Settings
├── electron/         Desktop shell (main.js)
└── .github/workflows/  Windows installer build (CI)
```

## Development setup (macOS, VS Code)

```bash
git clone https://github.com/SIDHANT036/ShopPOS.git
cd ShopPOS

npm install              # root: Electron tooling
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

npm run dev              # starts backend, Vite dev server, and Electron together
```

This runs the backend on `http://localhost:5050`, the Vite dev server on
`http://localhost:5173`, and opens an Electron window pointed at the Vite
server for hot reload while you work.

> **sqlite3 install errors?** `sqlite3` is a native module — if `npm
> install` in `backend/` fails while compiling it, make sure Xcode Command
> Line Tools are installed (`xcode-select --install`) and try again. Using
> an LTS Node version (18 or 20) also avoids most prebuilt-binary gaps.

## Where your data lives

The SQLite database, generated invoices, and backups are stored outside the
app folder so they survive updates and reinstalls:

| OS | Location |
|---|---|
| Windows | `%APPDATA%\Shop POS\` |
| macOS | `~/Library/Application Support/Shop POS/` |
| Linux | `~/.shop-pos/` |

## Building the Windows .exe from a Mac

You're developing on macOS but need to ship a Windows installer. Two ways
to do that:

### Option A — GitHub Actions (recommended)

This repo includes `.github/workflows/build-windows.yml`, which builds the
installer on a real Windows machine (a GitHub-hosted runner). This matters
because `sqlite3` is a native module that must be compiled *for Windows*,
and doing that reliably from macOS locally (via Wine) is fragile, especially
on Apple Silicon.

To use it:
1. Push this repo to GitHub (already done ✅).
2. Push a tag (`git tag v1.0.0 && git push --tags`), or go to the
   **Actions** tab on GitHub and run the workflow manually
   ("Run workflow").
3. Once it finishes, download the installer from the workflow run's
   **Artifacts** section.

### Option B — Building locally on your Mac

```bash
npm run dist
```

This runs `electron-builder` with the Windows (NSIS) target from your
`package.json`. `electron-builder` can cross-build Windows targets from
macOS, but native modules like `sqlite3` are the main source of failures
in this setup — if it fails, Option A will be more reliable.

## Why the backend runs *inside* Electron, not as a spawned process

The original version of this app spawned a separate `node` process to run
the backend (`spawn("node", [...])`). That only worked during development
because Node happened to be installed on that machine already — a shop's
Windows PC won't have Node.js installed, so the packaged app would fail
silently. Electron ships its own Node.js runtime, so `electron/main.js` now
`require()`s the backend directly into the main process instead. No
separate runtime needs to exist on the install target.

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/items?search=&category=&lowStock=true` | List/filter inventory |
| GET | `/items/categories` | Distinct category list |
| POST | `/items` | Add item |
| PUT | `/items/:id` | Update item |
| DELETE | `/items/:id` | Delete item |
| POST | `/items/bulk` | Bulk import (`{ items: [...] }`) |
| POST | `/sale` | Record a sale, decrement stock, generate invoice |
| GET | `/sales` | Sales history |
| GET | `/sales/:id` | Single sale with line items |
| GET | `/invoice/:invoiceNo` | Download the PDF invoice |
| GET / PUT | `/settings` | Shop name/address/phone, default GST & threshold |
| GET / POST | `/backup` | List / create backups |
| POST | `/backup/restore` | Restore from a backup (`{ filename }`) |

## Known limitations / next steps

- Backup restore requires an app restart to take effect (the running
  SQLite connection needs to reopen against the restored file).
- No user accounts / login — this is a single-user local app by design.
  `backend/routes/users.js` is an unused placeholder from an earlier
  draft; delete it if you don't plan to add multi-user support.
- The production Windows build hasn't been run end-to-end here (this was
  developed and tested on macOS/Linux) — run the GitHub Actions workflow
  and do one real install test on a Windows machine before handing it to
  a shop.
