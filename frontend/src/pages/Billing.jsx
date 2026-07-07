import { useEffect, useMemo, useState } from "react";
import api from "../api";
import * as XLSX from "xlsx";

export default function Billing() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);

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
    const existing = cart.find((i) => i.id === item.id);

    if (existing) {
      setCart(
        cart.map((i) =>
          i.id === item.id
            ? {
                ...i,
                qty: i.qty + 1,
              }
            : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...item,
          qty: 1,
        },
      ]);
    }
  }

  function increase(id) {
    setCart(
      cart.map((i) =>
        i.id === id
          ? {
              ...i,
              qty: i.qty + 1,
            }
          : i
      )
    );
  }

  function decrease(id) {
    setCart(
      cart
        .map((i) =>
          i.id === id
            ? {
                ...i,
                qty: i.qty - 1,
              }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
  }, [cart]);

  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  function downloadExcel() {
    const data = cart.map((i) => ({
      Item: i.name,
      Quantity: i.qty,
      Price: i.price,
      Amount: i.price * i.qty,
    }));

    data.push({});
    data.push({
      Item: "GST",
      Amount: gst,
    });

    data.push({
      Item: "TOTAL",
      Amount: total,
    });

    const sheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      "Invoice"
    );

    XLSX.writeFile(
      workbook,
      "Shop_Bill.xlsx"
    );
  }

  async function completeSale() {
    if (!cart.length) {
      alert("Cart is empty.");
      return;
    }

    try {
      const invoice = {
        invoiceNo: "INV-" + Date.now(),
        items: cart,
        gst,
        total,
      };

      await api.post("/sale", invoice);

      // Keep Excel functionality
      downloadExcel();

      alert("Sale completed successfully.");

      setCart([]);

      loadItems();
    } catch (err) {
      console.error(err);
      alert("Failed to complete sale.");
    }
  }

  return (
    <div>
      <h1>Billing</h1>

      <h3>Products</h3>

      {items.map((item) => (
        <button
          key={item.id}
          style={{ margin: 5 }}
          onClick={() => add(item)}
        >
          {item.name} ₹{item.price}
        </button>
      ))}

      <hr />

      <h2>Cart</h2>

      {cart.length === 0 && <p>Cart is empty.</p>}

      {cart.map((c) => (
        <div
          key={c.id}
          style={{
            marginBottom: 10,
          }}
        >
          <strong>{c.name}</strong>

          {"  "}

          ₹{c.price}

          {"  "}

          <button onClick={() => decrease(c.id)}>
            -
          </button>

          <span
            style={{
              margin: "0 10px",
            }}
          >
            {c.qty}
          </span>

          <button onClick={() => increase(c.id)}>
            +
          </button>

          {"  =  ₹"}

          {(c.qty * c.price).toFixed(2)}
        </div>
      ))}

      <hr />

      <h3>
        Subtotal : ₹{subtotal.toFixed(2)}
      </h3>

      <h3>
        GST (18%) : ₹{gst.toFixed(2)}
      </h3>

      <h2>
        Total : ₹{total.toFixed(2)}
      </h2>

      <button
        onClick={downloadExcel}
        disabled={!cart.length}
      >
        Download Excel Bill
      </button>

      <button
        style={{
          marginLeft: 10,
        }}
        onClick={completeSale}
        disabled={!cart.length}
      >
        Complete Sale
      </button>
    </div>
  );
}