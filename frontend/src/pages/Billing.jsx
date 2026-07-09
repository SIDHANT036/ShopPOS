import { useEffect, useMemo, useState, useRef } from "react";
import api from "../api";
import * as XLSX from "xlsx";
import { Search, ScanLine, FileDown, FileText } from "lucide-react";
import Cart from "../components/Cart";

export default function Billing() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [scanCode, setScanCode] = useState("");
  const [lastInvoiceNo, setLastInvoiceNo] = useState(null);
  const scanRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const res = await api.get("/items");
      setItems(res.data);
    } catch (err) {
      console.error(err);
      alert("Unable to load products.");
    }
  }

  function add(item) {
    setCart((cart) => {
      const existing = cart.find((i) => i.id === item.id);
      if (existing) {
        return cart.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...cart, { ...item, qty: 1 }];
    });
  }

  function increase(id) {
    setCart((cart) => cart.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
  }

  function decrease(id) {
    setCart((cart) =>
      cart.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0)
    );
  }

  function setQty(id, qty) {
    setCart((cart) => (qty <= 0 ? cart.filter((i) => i.id !== id) : cart.map((i) => (i.id === id ? { ...i, qty } : i))));
  }

  function removeItem(id) {
    setCart((cart) => cart.filter((i) => i.id !== id));
  }

  function handleScan(e) {
    if (e.key !== "Enter") return;
    const code = scanCode.trim();
    if (!code) return;

    const match = items.find((i) => i.barcode && i.barcode === code);
    if (match) {
      add(match);
    } else {
      alert(`No item found with barcode "${code}".`);
    }
    setScanCode("");
    scanRef.current?.focus();
  }

  const filteredProducts = items.filter((i) => {
    const term = productSearch.toLowerCase();
    return !term || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term);
  });

  // GST applied per line using each item's own rate - not a flat blanket rate,
  // since different products can legitimately carry different GST slabs.
  const subtotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);
  const gstTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.qty * ((i.gst || 0) / 100), 0),
    [cart]
  );
  const total = subtotal + gstTotal;
  const profit = useMemo(
    () => cart.reduce((sum, i) => sum + (i.price - (i.cost || 0)) * i.qty, 0),
    [cart]
  );

  function downloadExcel(invoiceNo) {
    const rows = cart.map((i) => ({
      Item: i.name,
      Quantity: i.qty,
      Price: i.price,
      "GST %": i.gst || 0,
      Amount: (i.price * i.qty * (1 + (i.gst || 0) / 100)).toFixed(2),
    }));
    rows.push({});
    rows.push({ Item: "Subtotal", Amount: subtotal.toFixed(2) });
    rows.push({ Item: "GST", Amount: gstTotal.toFixed(2) });
    rows.push({ Item: "TOTAL", Amount: total.toFixed(2) });

    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Invoice");
    XLSX.writeFile(wb, `${invoiceNo || "Shop_Bill"}.xlsx`);
  }

  function downloadPdf(invoiceNo) {
    window.open(`${api.defaults.baseURL}/invoice/${invoiceNo}`, "_blank");
  }

  async function completeSale() {
    if (!cart.length) {
      alert("Cart is empty.");
      return;
    }

    try {
      const payload = {
        items: cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty, price: c.price, gst: c.gst || 0 })),
        total,
        gst: gstTotal,
        profit,
      };

      const res = await api.post("/sale", payload);
      const invoiceNo = res.data.invoiceNo;

      setLastInvoiceNo(invoiceNo);
      downloadExcel(invoiceNo);

      alert(`Sale completed. Invoice ${invoiceNo}.`);
      setCart([]);
      loadItems();
    } catch (err) {
      console.error(err);
      alert("Failed to complete sale.");
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <h1>Billing</h1>
      </div>

      <div className="pos-layout">
        <div>
          <div className="scan-box">
            <input
              ref={scanRef}
              placeholder="Scan barcode, then press Enter..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={handleScan}
            />
            <ScanLine size={20} style={{ alignSelf: "center", color: "var(--ink-soft)" }} />
          </div>

          <div className="search-box" style={{ marginBottom: 14 }}>
            <Search size={16} />
            <input
              placeholder="Or search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>

          <div className="product-grid">
            {filteredProducts.map((item) => (
              <button key={item.id} className="product-btn" onClick={() => add(item)}>
                <span className="pname">{item.name}</span>
                <span className="pmeta">
                  ₹{item.price} · stock {item.quantity}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="tape">
            <h3 style={{ marginBottom: 12 }}>Current Bill</h3>

            <Cart cart={cart} onIncrease={increase} onDecrease={decrease} onSetQty={setQty} onRemove={removeItem} />

            {cart.length > 0 && (
              <div className="tape-totals">
                <div className="line">
                  <span>Subtotal</span>
                  <span className="num">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="line">
                  <span>GST</span>
                  <span className="num">₹{gstTotal.toFixed(2)}</span>
                </div>
                <div className="grand">
                  <span>Total</span>
                  <span className="num">₹{total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="tape-edge" />

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            <button className="primary" onClick={completeSale} disabled={!cart.length}>
              Complete Sale
            </button>
            <button onClick={() => downloadExcel(lastInvoiceNo)} disabled={!cart.length}>
              <FileDown size={16} /> Download Excel Bill
            </button>
            {lastInvoiceNo && (
              <button onClick={() => downloadPdf(lastInvoiceNo)}>
                <FileText size={16} /> Download PDF Invoice ({lastInvoiceNo})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
