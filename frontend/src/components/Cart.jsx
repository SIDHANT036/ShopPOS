import { Minus, Plus, X } from "lucide-react";

export default function Cart({ cart, onIncrease, onDecrease, onSetQty, onRemove }) {
  if (cart.length === 0) {
    return <div className="empty-state">Cart is empty. Scan or tap a product to start a bill.</div>;
  }

  return (
    <div>
      {cart.map((c) => {
        const lineTotal = c.price * c.qty * (1 + (c.gst || 0) / 100);
        return (
          <div className="tape-row" key={c.id}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div className="num" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                ₹{c.price} · GST {c.gst || 0}%
              </div>
            </div>

            <div className="qty-controls">
              <button onClick={() => onDecrease(c.id)}>
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={c.qty}
                onChange={(e) => onSetQty(c.id, Math.max(0, Number(e.target.value) || 0))}
              />
              <button onClick={() => onIncrease(c.id)}>
                <Plus size={14} />
              </button>
            </div>

            <div className="num" style={{ width: 84, textAlign: "right" }}>
              ₹{lineTotal.toFixed(2)}
            </div>

            <button className="ghost" onClick={() => onRemove(c.id)} title="Remove">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
