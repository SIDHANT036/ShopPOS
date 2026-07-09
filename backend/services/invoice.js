const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { invoicesFolder } = require("../database");

const COLS = {
  item: 50,
  qty: 300,
  price: 360,
  gst: 430,
  amount: 480,
};
const PAGE_RIGHT = 545;

function money(n) {
  return `Rs. ${Number(n || 0).toFixed(2)}`;
}

/**
 * Renders a PDF invoice to disk and returns its absolute path.
 *
 * @param {object} invoice
 * @param {string} invoice.invoiceNo
 * @param {Array}  invoice.items   [{ name, qty, price, gst }]
 * @param {number} invoice.subtotal
 * @param {number} invoice.gst      total gst amount
 * @param {number} invoice.total
 * @param {object} shop  { shopName, shopAddress, shopPhone }
 * @returns {string} absolute file path of the generated PDF
 */
function createPDF(invoice, shop = {}) {
  const {
    shopName = "My Shop",
    shopAddress = "",
    shopPhone = "",
  } = shop;

  const filename = `invoice_${invoice.invoiceNo}.pdf`;
  const filePath = path.join(invoicesFolder, filename);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  // ---- Header -------------------------------------------------
  doc.fontSize(20).font("Helvetica-Bold").text(shopName);
  doc.font("Helvetica").fontSize(10).fillColor("#444");
  if (shopAddress) doc.text(shopAddress);
  if (shopPhone) doc.text(`Phone: ${shopPhone}`);
  doc.fillColor("#000");

  doc.moveDown();
  doc
    .moveTo(50, doc.y)
    .lineTo(PAGE_RIGHT, doc.y)
    .strokeColor("#ccc")
    .stroke();
  doc.moveDown(0.5);

  // ---- Invoice meta --------------------------------------------
  doc.fontSize(11).font("Helvetica-Bold").text(`Invoice: ${invoice.invoiceNo}`);
  doc
    .font("Helvetica")
    .text(`Date: ${new Date().toLocaleString("en-IN")}`);

  doc.moveDown();

  // ---- Table header ----------------------------------------------
  const tableTop = doc.y;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Item", COLS.item, tableTop);
  doc.text("Qty", COLS.qty, tableTop);
  doc.text("Price", COLS.price, tableTop);
  doc.text("GST%", COLS.gst, tableTop);
  doc.text("Amount", COLS.amount, tableTop);

  doc
    .moveTo(50, tableTop + 15)
    .lineTo(PAGE_RIGHT, tableTop + 15)
    .strokeColor("#ccc")
    .stroke();

  // ---- Table rows -------------------------------------------------
  doc.font("Helvetica").fontSize(10);
  let y = tableTop + 22;

  invoice.items.forEach((i) => {
    const qty = i.qty ?? i.quantity ?? 0;
    const gstRate = i.gst ?? 0;
    const lineAmount = i.price * qty * (1 + gstRate / 100);

    doc.text(i.name, COLS.item, y, { width: COLS.qty - COLS.item - 10 });
    doc.text(String(qty), COLS.qty, y);
    doc.text(i.price.toFixed(2), COLS.price, y);
    doc.text(`${gstRate}%`, COLS.gst, y);
    doc.text(lineAmount.toFixed(2), COLS.amount, y);

    y += 20;
  });

  doc.moveTo(50, y).lineTo(PAGE_RIGHT, y).strokeColor("#ccc").stroke();
  y += 12;

  // ---- Totals -------------------------------------------------------
  const subtotal = invoice.subtotal ?? invoice.total - invoice.gst;

  doc.text(`Subtotal:`, COLS.gst - 60, y);
  doc.text(money(subtotal), COLS.amount, y);
  y += 16;

  doc.text(`GST:`, COLS.gst - 60, y);
  doc.text(money(invoice.gst), COLS.amount, y);
  y += 16;

  doc.font("Helvetica-Bold").fontSize(12);
  doc.text(`TOTAL:`, COLS.gst - 60, y);
  doc.text(money(invoice.total), COLS.amount, y);

  doc.moveDown(3);
  doc
    .font("Helvetica-Oblique")
    .fontSize(9)
    .fillColor("#777")
    .text("Thank you for your business.", 50, doc.y, {
      width: PAGE_RIGHT - 50,
      align: "center",
    });

  doc.end();

  return filePath;
}

module.exports = createPDF;
