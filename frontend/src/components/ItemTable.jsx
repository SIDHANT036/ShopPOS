import { Edit, Trash2 } from "lucide-react";

export default function ItemTable({ items, onEdit, onDelete }) {
  if (items.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">No items match yet. Try adding one, or clear your filters.</div>
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Barcode</th>
          <th>Cost</th>
          <th>Selling</th>
          <th>Stock</th>
          <th>GST</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        {items.map((item) => {
          const low = item.quantity <= (item.lowStockThreshold ?? 5);
          return (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td className="num">{item.barcode || "—"}</td>
              <td className="num">₹{Number(item.cost).toFixed(2)}</td>
              <td className="num">₹{Number(item.price).toFixed(2)}</td>
              <td>
                <span className={`badge ${low ? "low" : "ok"}`}>{item.quantity}</span>
              </td>
              <td className="num">{item.gst}%</td>
              <td>
                <button className="ghost" onClick={() => onEdit(item)} title="Edit">
                  <Edit size={16} />
                </button>
                <button className="ghost" onClick={() => onDelete(item.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
