import { useEffect, useState } from "react";
import api from "../api";
import { Save, DatabaseBackup, RotateCcw } from "lucide-react";

export default function Settings({ onSettingsSaved }) {
  const [form, setForm] = useState(null);
  const [backups, setBackups] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/settings").then((res) => setForm(res.data));
    loadBackups();
  }, []);

  function loadBackups() {
    api.get("/backup").then((res) => setBackups(res.data)).catch(() => {});
  }

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings", form);
      onSettingsSaved?.(form);
      alert("Settings saved.");
    } catch {
      alert("Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function backupNow() {
    try {
      await api.post("/backup");
      loadBackups();
    } catch {
      alert("Backup failed.");
    }
  }

  async function restore(filename) {
    if (
      !confirm(
        `Restore from "${filename}"? This replaces all current data. Shop POS should be restarted right after.`
      )
    )
      return;

    try {
      const res = await api.post("/backup/restore", { filename });
      alert(res.data.message);
    } catch {
      alert("Restore failed.");
    }
  }

  if (!form) return <div className="page">Loading settings...</div>;

  return (
    <div className="page">
      <div className="topbar">
        <h1>Settings</h1>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 14 }}>Shop details</h3>
        <form className="settings-form" onSubmit={save}>
          <label>
            Shop name
            <input value={form.shopName || ""} onChange={(e) => set("shopName", e.target.value)} />
          </label>

          <label>
            Address (shown on invoices)
            <input value={form.shopAddress || ""} onChange={(e) => set("shopAddress", e.target.value)} />
          </label>

          <label>
            Phone
            <input value={form.shopPhone || ""} onChange={(e) => set("shopPhone", e.target.value)} />
          </label>

          <label>
            Default GST % for new items
            <input
              type="number"
              step="0.01"
              value={form.defaultGst}
              onChange={(e) => set("defaultGst", Number(e.target.value))}
            />
          </label>

          <label>
            Default low-stock threshold for new items
            <input
              type="number"
              value={form.defaultLowStockThreshold}
              onChange={(e) => set("defaultLowStockThreshold", Number(e.target.value))}
            />
          </label>

          <div>
            <button type="submit" className="primary" disabled={saving}>
              <Save size={16} /> Save settings
            </button>
          </div>
        </form>
      </div>

      <div className="card card-pad">
        <h3 style={{ marginBottom: 14 }}>Backups</h3>
        <p style={{ marginBottom: 14, color: "var(--ink-soft)", fontSize: 13.5 }}>
          Your data is stored locally and updates automatically as you use the app. Use this to keep
          extra timestamped copies you can roll back to.
        </p>

        <button onClick={backupNow} style={{ marginBottom: 14 }}>
          <DatabaseBackup size={16} /> Backup now
        </button>

        {backups.length === 0 ? (
          <div className="empty-state">No backups yet.</div>
        ) : (
          <ul className="backup-list">
            {backups.map((b) => (
              <li key={b.filename}>
                <span>
                  {b.filename} <span style={{ color: "var(--ink-soft)" }}>({(b.sizeBytes / 1024).toFixed(1)} KB)</span>
                </span>
                <button className="ghost" onClick={() => restore(b.filename)}>
                  <RotateCcw size={15} /> Restore
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
