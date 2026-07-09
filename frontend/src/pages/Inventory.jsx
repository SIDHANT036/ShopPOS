import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import api from "../api";
import { Plus, Search, Download, Upload, AlertTriangle } from "lucide-react";
import ItemForm from "../components/ItemForm";
import ItemTable from "../components/ItemTable";

export default function Inventory({ settings }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fileInputRef = useRef(null);

  function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (lowStockOnly) params.set("lowStock", "true");

    api
      .get(`/items?${params.toString()}`)
      .then((res) => setItems(res.data))
      .catch(() => alert("Unable to load inventory."));
  }

  function loadCategories() {
    api
      .get("/items/categories")
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }

  useEffect(load, [search, category, lowStockOnly]);
  useEffect(loadCategories, []);

  const lowStockCount = items.filter((i) => i.quantity <= (i.lowStockThreshold ?? 5)).length;

  function saveItem(form) {
    const req = editingItem ? api.put(`/items/${editingItem.id}`, form) : api.post("/items", form);
    req
      .then(() => {
        setShowForm(false);
        setEditingItem(null);
        load();
        loadCategories();
      })
      .catch(() => alert("Unable to save item."));
  }

  function deleteItem(id) {
    if (!confirm("Delete this item?")) return;
    api
      .delete(`/items/${id}`)
      .then(load)
      .catch(() => alert("Unable to delete item."));
  }

  function exportExcel() {
    const rows = items.map((i) => ({
      name: i.name,
      category: i.category,
      barcode: i.barcode || "",
      cost: i.cost,
      price: i.price,
      quantity: i.quantity,
      gst: i.gst,
      lowStockThreshold: i.lowStockThreshold,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Inventory");
    XLSX.writeFile(wb, "inventory_export.xlsx");
  }

  function importExcel(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const mapped = rows.map((r) => ({
          name: r.name ?? r.Name ?? "",
          category: r.category ?? r.Category ?? "",
          barcode: r.barcode ?? r.Barcode ?? "",
          cost: r.cost ?? r.Cost ?? 0,
          price: r.price ?? r.Price ?? 0,
          quantity: r.quantity ?? r.Quantity ?? 0,
          gst: r.gst ?? r.GST ?? 18,
          lowStockThreshold: r.lowStockThreshold ?? r.LowStockThreshold ?? 5,
        }));

        api
          .post("/items/bulk", { items: mapped })
          .then((res) => {
            const { inserted, updated, errors } = res.data;
            alert(
              `Import complete: ${inserted} added, ${updated} updated.` +
                (errors?.length ? `\n${errors.length} row(s) skipped.` : "")
            );
            load();
            loadCategories();
          })
          .catch(() => alert("Import failed."));
      } catch {
        alert("Couldn't read that file. Please upload a .xlsx exported from this app (or with the same columns).");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="page">
      <div className="topbar">
        <h1>Inventory</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import Excel
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={importExcel}
          />
          <button onClick={exportExcel}>
            <Download size={16} /> Export Excel
          </button>
          <button className="primary" onClick={() => { setEditingItem(null); setShowForm(true); }}>
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={17} />
          {lowStockCount} item{lowStockCount > 1 ? "s" : ""} at or below their low-stock threshold.
        </div>
      )}

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            style={{ width: "auto" }}
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {showForm && (
        <ItemForm
          item={editingItem}
          defaultGst={settings?.defaultGst}
          defaultLowStockThreshold={settings?.defaultLowStockThreshold}
          onSave={saveItem}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}

      <ItemTable
        items={items}
        onEdit={(item) => { setEditingItem(item); setShowForm(true); }}
        onDelete={deleteItem}
      />
    </div>
  );
}
