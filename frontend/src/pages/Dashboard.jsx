import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/sales"), api.get("/items")])
      .then(([salesRes, itemsRes]) => {
        setSales(salesRes.data);
        setItems(itemsRes.data);
      })
      .catch((err) => console.error("Failed to load dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
  const lowStockCount = items.filter((i) => i.quantity <= (i.lowStockThreshold ?? 5)).length;

  // Most recent 20 sales, oldest-to-newest so the chart reads left-to-right
  const chartData = [...sales].slice(0, 20).reverse();

  return (
    <div className="page">
      <div className="topbar">
        <h1>Dashboard</h1>
      </div>

      <div className="stat-row">
        <div className="card stat">
          <div className="label">Total Sales</div>
          <div className="value">{sales.length}</div>
        </div>
        <div className="card stat">
          <div className="label">Revenue</div>
          <div className="value">₹{totalRevenue.toFixed(2)}</div>
        </div>
        <div className="card stat">
          <div className="label">Profit</div>
          <div className="value">₹{totalProfit.toFixed(2)}</div>
        </div>
        <div className={`card stat ${lowStockCount > 0 ? "danger" : ""}`}>
          <div className="label">Low Stock Items</div>
          <div className="value">{lowStockCount}</div>
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ marginBottom: 16 }}>Recent Sales</h3>

        {loading ? (
          <p>Loading sales data...</p>
        ) : sales.length === 0 ? (
          <div className="empty-state">No sales recorded yet. Completed bills will show up here.</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="invoiceNo" tick={{ fontSize: 11 }} hide />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="var(--brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
