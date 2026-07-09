import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import api from "./api";

function App() {
  const [page, setPage] = useState("inventory");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setSettings(res.data))
      .catch(() => setSettings({}));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar page={page} setPage={setPage} shopName={settings?.shopName} />

      <main className="content">
        {page === "inventory" && <Inventory settings={settings} />}
        {page === "billing" && <Billing />}
        {page === "dashboard" && <Dashboard />}
        {page === "settings" && <Settings onSettingsSaved={setSettings} />}
      </main>
    </div>
  );
}

export default App;
