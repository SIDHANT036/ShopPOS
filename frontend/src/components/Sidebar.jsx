import { Package, Receipt, LayoutDashboard, Settings } from "lucide-react";

const NAV = [
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "billing", label: "Billing", icon: Receipt },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ page, setPage, shopName }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="mark">●</span>
        <h1>Shop POS</h1>
      </div>

      <nav>
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={page === key ? "active" : ""}
            onClick={() => setPage(key)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="spacer" />

      <div className="shopname">{shopName || "My Shop"}</div>
    </aside>
  );
}
