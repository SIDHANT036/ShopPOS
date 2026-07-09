import { useState } from "react";

export default function ItemForm({ item, defaultGst, defaultLowStockThreshold, onSave, onCancel }) {
  const isEdit = !!item;

  const [form, setForm] = useState(
    item || {
      name: "",
      category: "",
      barcode: "",
      cost: "",
      price: "",
      quantity: "",
      gst: defaultGst ?? 18,
      lowStockThreshold: defaultLowStockThreshold ?? 5,
    }
  );

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.name || !form.category) {
      alert("Name and category are required.");
      return;
    }
    onSave({
      ...form,
      cost: Number(form.cost) || 0,
      price: Number(form.price) || 0,
      quantity: Number(form.quantity) || 0,
      gst: Number(form.gst) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{isEdit ? "Edit Item" : "Add Item"}</h2>

        <div className="form-grid">
          <label className="full">
            Name
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              autoFocus
            />
          </label>

          <label>
            Category
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </label>

          <label>
            Barcode (optional)
            <input
              value={form.barcode || ""}
              onChange={(e) => set("barcode", e.target.value)}
              placeholder="Scan or type"
            />
          </label>

          <label>
            Cost price (₹)
            <input
              type="number"
              step="0.01"
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
            />
          </label>

          <label>
            Selling price (₹)
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </label>

          <label>
            Quantity in stock
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
            />
          </label>

          <label>
            GST %
            <input
              type="number"
              step="0.01"
              value={form.gst}
              onChange={(e) => set("gst", e.target.value)}
            />
          </label>

          <label className="full">
            Low stock alert below
            <input
              type="number"
              value={form.lowStockThreshold}
              onChange={(e) => set("lowStockThreshold", e.target.value)}
            />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="primary">
            Save item
          </button>
        </div>
      </form>
    </div>
  );
}
